/**
 * Display a social feed using outbox relays for optimal event distribution
 * @tags nip-02, nip-65, outbox, feed, social
 * @related outbox/relay-selection, feed/relay-timeline
 */
import {
  defined,
  EventStore,
  filterOptimalRelays,
  includeFallbackRelays,
  includeMailboxes,
  mapEventsToStore,
} from "applesauce-core";
import {
  createOutboxMap,
  Filter,
  getDisplayName,
  getProfilePicture,
  getSeenRelays,
  NostrEvent,
  persistEventsToCache,
  relaySet,
  unixNow,
} from "applesauce-core/helpers";
import { createEventLoaderForStore, loadBlocksFromOutboxMap, TimelineWindow } from "applesauce-loaders/loaders";
import { use$, useObservableEagerState } from "applesauce-react/hooks";
import { ignoreUnhealthyRelaysOnPointers, RelayHealthState, RelayLiveness, RelayPool } from "applesauce-relay";
import localforage from "localforage";
import { addEvents, getEventsForFilters, openDB } from "nostr-idb";
import { ProfilePointer } from "nostr-tools/nip19";
import pastellify from "pastellify";
import { useMemo, useState } from "react";
import { SubmitHandler } from "react-hook-form";
import { useObservable } from "react-use";
import { BehaviorSubject, debounceTime, map, of, shareReplay, switchMap } from "rxjs";

import PubkeyPicker from "../../components/pubkey-picker";

const pubkey$ = new BehaviorSubject<string | null>(null);

const pool = new RelayPool();
const eventStore = new EventStore();

// Setup a local event cache
const cache = await openDB();
function cacheRequest(filters: Filter[]) {
  return getEventsForFilters(cache, filters);
}

// Save all new events to the cache
persistEventsToCache(eventStore, (events) => addEvents(cache, events));

// Create unified event loader for the store
createEventLoaderForStore(eventStore, pool, {
  cacheRequest,
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com/", "wss://indexer.coracle.social/"],
});

// Create a liveness tracker and connect to the pool
const liveness = new RelayLiveness({
  storage: localforage.createInstance({ name: "liveness" }),
});
await liveness.load();
liveness.connectToPool(pool);

// A list of extra relays to always use
const fallbacks$ = new BehaviorSubject<string[]>([]);

// The maximum number of connections to make
const maxConnections$ = new BehaviorSubject(30);

// The maximum number of relays to select per user
const maxRelaysPerUser$ = new BehaviorSubject(4);

/** An observable of the users contacts */
const contacts$ = pubkey$.pipe(
  // Wait for user to login
  defined(),
  // Get the contacts for the user
  switchMap((pubkey) => eventStore.contacts(pubkey)),
);

/** An observable of contacts with outboxes and unhealthy relays filtered out */
const contactsWithOutboxes$ = contacts$.pipe(
  // Wait for contacts to be fetched
  defined(),
  // Load the NIP-65 outboxes for all contacts
  includeMailboxes(eventStore),
  // Ignore unhealthy relays from the liveness tracker
  ignoreUnhealthyRelaysOnPointers(liveness),
  // Only calculate it once
  shareReplay(1),
);

// Create an observable of contacts -> contacts with relay selection / fallbacks
const selection$ = contactsWithOutboxes$.pipe(
  // First include fallback relays
  includeFallbackRelays(fallbacks$),
  // Debounce recalculations for performance
  debounceTime(200),
  // Select the best relays for the contacts
  filterOptimalRelays(maxConnections$, maxRelaysPerUser$),
  // Keep the last value so reconnection works
  shareReplay(1),
);

// Create an observable that converts selection to an outbox map
const outboxMap$ = selection$.pipe(map(createOutboxMap));

// Hard code start time for live so it does not change and cause filters to change (resubscribe to relays)
const aMinuteAgo = unixNow() - 60;

// Create a live subscription for users feeds
const live$ = pool
  .outboxSubscription(
    outboxMap$,
    // Subscribe to notes from the last minute
    { kinds: [1], since: aMinuteAgo },
  )
  .pipe(
    // Add events to the event store
    mapEventsToStore(eventStore),
  );

// The current state of the timeline, {since, until}
// Initialize with since: -Infinity to force loading the first block of events
const window$ = new BehaviorSubject<TimelineWindow>({ since: -Infinity });

// Create a timeline loader and add events to the event store
const timeline$ = window$.pipe(
  // When the timeline window changes, load missing events
  loadBlocksFromOutboxMap(
    pool,
    outboxMap$,
    // Base filter to use for blocks of events
    { kinds: [1] },
    // Load 100 events at a time
    { limit: 100 },
  ),
  // Add events to the event store
  mapEventsToStore(eventStore),
);

// Global state for previewing user
const preview$ = new BehaviorSubject<ProfilePointer | null>(null);

function NoteRelay({ relay }: { relay: string }) {
  const info = use$(() => pool.relay(relay).information$, [relay]);
  const icon = use$(() => pool.relay(relay).icon$, [relay]);
  const name = info?.name || relay.replace("wss://", "").replace("ws://", "");
  const color = pastellify(relay, { toCSS: true });

  return (
    <div
      className="w-32 gap-2 relative flex items-end overflow-y-visible overflow-x-hidden border-b-1 pb-1"
      style={{ borderBottomColor: color }}
    >
      <div className="avatar">
        <div className="w-5 h-5 rounded-full">
          <img src={icon} className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="truncate text-xs">{name}</div>
    </div>
  );
}

function Note({ note, selection }: { note: NostrEvent; selection?: string[] }) {
  // Subscribe to the request and wait for the profile event
  const profile = use$(() => eventStore.profile(note.pubkey), [note.pubkey]);
  const mailboxes = use$(() => eventStore.mailboxes(note.pubkey), [note.pubkey]);

  const displayName = getDisplayName(profile, note.pubkey.slice(0, 8) + "...");
  const avatarUrl = getProfilePicture(profile, `https://robohash.org/${note.pubkey}.png`);

  const relays = Array.from(getSeenRelays(note) ?? []).sort();

  return (
    <div className="border-b border-base-300 px-2 py-4">
      <div className="flex items-start gap-3">
        <div className="avatar">
          <div className="w-12 h-12 rounded-full">
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <a className="font-semibold text-sm link" onClick={() => preview$.next({ pubkey: note.pubkey })}>
              {displayName}
            </a>
            <span className="text-xs text-base-content/60">
              {new Date(note.created_at * 1000).toLocaleTimeString()}
            </span>
            <span className="text-xs text-base-content/60 ms-auto">
              From {selection?.length ?? 0} of {mailboxes?.outboxes.length ?? 0} outboxes
            </span>
          </div>
          <p className="text-sm leading-relaxed break-words">{note.content}</p>
        </div>
      </div>
      <div className="flex gap-4 mt-4">
        {relays.map((relay) => (
          <NoteRelay key={relay} relay={relay} />
        ))}
      </div>
    </div>
  );
}

// User Avatar Component for sidebar
function UserAvatar({ user }: { user: ProfilePointer }) {
  const profile = use$(() => eventStore.profile(user), [user.pubkey]);
  use$(() => eventStore.mailboxes(user), [user.pubkey]);

  const displayName = getDisplayName(profile, user.pubkey.slice(0, 8) + "...");
  const avatarUrl = getProfilePicture(profile, `https://robohash.org/${user.pubkey}.png`);

  return (
    <div
      className="flex flex-col items-center gap-1 hover:bg-base-200 cursor-pointer"
      onClick={() => preview$.next(user)}
    >
      <div className="avatar">
        <div className="rounded-full w-8 h-8">
          <img src={avatarUrl} className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="text-xs max-w-16 overflow-hidden truncate">{displayName}</div>
    </div>
  );
}

// User Issues Component for sidebar
function UserIssuesSection({
  selection,
  contacts,
}: {
  selection: any[] | null | undefined;
  contacts: any[] | null | undefined;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Calculate missing relays users - users who never had any relays (no NIP-65 relay list)
  const missingRelaysUsers = useMemo(() => {
    if (!contacts || !selection) return [];

    const originalMap = new Map(contacts.map((user) => [user.pubkey, user]));

    return selection.filter((selectedUser) => {
      const originalUser = originalMap.get(selectedUser.pubkey);
      const hasNoRelaysInOriginal = !originalUser?.relays || originalUser.relays.length === 0;
      const hasNoRelaysInSelected = !selectedUser.relays || selectedUser.relays.length === 0;

      return hasNoRelaysInOriginal && hasNoRelaysInSelected;
    });
  }, [contacts, selection]);

  // Calculate orphaned users - users who had relays originally but have none after selection
  const orphanedUsers = useMemo(() => {
    if (!contacts || !selection) return [];

    const selectedMap = new Map(selection.map((user) => [user.pubkey, user]));

    return contacts.filter((originalUser) => {
      const hasOriginalRelays = originalUser.relays && originalUser.relays.length > 0;
      const selectedUser = selectedMap.get(originalUser.pubkey);
      const hasSelectedRelays = selectedUser?.relays && selectedUser.relays.length > 0;

      return hasOriginalRelays && !hasSelectedRelays;
    });
  }, [contacts, selection]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const totalIssues = missingRelaysUsers.length + orphanedUsers.length;

  if (totalIssues === 0) return null;

  return (
    <div className="border-b border-base-300 py-4">
      <div className="flex items-center justify-between mx-4">
        <h3 className="text-lg font-semibold">User Issues</h3>
      </div>

      {/* Missing Relays Section */}
      {missingRelaysUsers.length > 0 && (
        <div>
          <button
            className="w-full hover:bg-base-200 text-left py-2 px-4"
            onClick={() => toggleSection("missing-relays")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-sm">{expandedSections.has("missing-relays") ? "▼" : "▶"}</div>
                <div className="font-medium text-warning">Missing Relays</div>
              </div>
              <div className="badge badge-warning badge-sm">{missingRelaysUsers.length}</div>
            </div>
            <div className="text-xs text-base-content/60 ml-6">Users without any relays (no NIP-65 published)</div>
          </button>

          {expandedSections.has("missing-relays") && (
            <div className="mx-2">
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-3 gap-1">
                  {missingRelaysUsers.map((user) => (
                    <UserAvatar key={user.pubkey} user={user} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orphaned Users Section */}
      {orphanedUsers.length > 0 && (
        <div>
          <button
            className="w-full hover:bg-base-200 text-left py-2 px-4"
            onClick={() => toggleSection("orphaned-users")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-sm">{expandedSections.has("orphaned-users") ? "▼" : "▶"}</div>
                <div className="font-medium text-error">Orphaned Users</div>
              </div>
              <div className="badge badge-error badge-sm">{orphanedUsers.length}</div>
            </div>
            <div className="text-xs text-base-content/60 ml-6">Users who lost all relays after selection</div>
          </button>

          {expandedSections.has("orphaned-users") && (
            <div className="mx-2">
              <div className="max-h-32 overflow-y-auto">
                <div className="grid grid-cols-3 gap-1">
                  {orphanedUsers.map((user) => (
                    <UserAvatar key={user.pubkey} user={user} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// User Preview Modal Component
function UserPreviewModal({ selection }: { selection?: ProfilePointer[] }) {
  const previewUser = use$(preview$);

  const profile = use$(() => (previewUser ? eventStore.profile(previewUser) : undefined), [previewUser?.pubkey]);
  const mailboxes = use$(() => (previewUser ? eventStore.mailboxes(previewUser) : undefined), [previewUser?.pubkey]);

  // get the selected user
  const selected = selection?.find((user) => user.pubkey === previewUser?.pubkey);

  const displayName = profile ? getDisplayName(profile, previewUser?.pubkey.slice(0, 8) + "...") : "";
  const avatarUrl = profile ? getProfilePicture(profile, `https://robohash.org/${previewUser?.pubkey}.png`) : "";

  // Get relays that where explicitly selected for this user
  const manual =
    mailboxes &&
    selected?.relays?.filter((relay) => !mailboxes?.inboxes.includes(relay) && !mailboxes?.outboxes.includes(relay));

  const closeModal = () => {
    preview$.next(null);
  };

  if (!previewUser) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={closeModal}>
            ✕
          </button>
        </form>

        <div className="flex flex-col items-center gap-4">
          {/* User Avatar and Name */}
          <div className="flex flex-col items-center gap-2">
            <div className="avatar">
              <div className="w-24 h-24 rounded-full">
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              </div>
            </div>
            <h3 className="font-bold text-lg">{displayName}</h3>
            <div className="text-sm text-base-content/60 font-mono">{previewUser.pubkey.slice(0, 16)}...</div>
          </div>

          {/* Refresh Button */}
          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => {
                pubkey$.next(previewUser.pubkey);
                closeModal();
              }}
            >
              Set pubkey
            </button>
          </div>

          {/* Selected Relays */}
          <div className="w-full">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <span>Selected Relays ({selected?.relays?.length || 0})</span>
            </h4>
            <div className="space-y-1">
              {selected?.relays && selected.relays.length > 0 ? (
                selected.relays.map((relay) => (
                  <div
                    key={relay}
                    className={`text-sm bg-base-200 rounded px-2 py-1 font-mono ${selected?.relays?.includes(relay) ? "text-primary" : ""}`}
                  >
                    {relay}
                  </div>
                ))
              ) : (
                <div className="text-sm text-base-content/60">No selected relays found</div>
              )}
            </div>
          </div>

          {/* Manual Relays */}
          {manual && manual.length > 0 && (
            <div className="w-full">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span>Manual Relays ({manual?.length || 0})</span>
              </h4>
              <div className="space-y-1">
                {manual.map((relay) => (
                  <div
                    key={relay}
                    className={`text-sm bg-base-200 rounded px-2 py-1 font-mono ${selected?.relays?.includes(relay) ? "text-primary" : ""}`}
                  >
                    {relay}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inbox Relays */}
          <div className="w-full">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <span>Inbox Relays ({mailboxes?.inboxes.length || 0})</span>
            </h4>
            <div className="space-y-1">
              {mailboxes?.inboxes && mailboxes.inboxes.length > 0 ? (
                mailboxes.inboxes.map((relay) => (
                  <div
                    key={relay}
                    className={`text-sm bg-base-200 rounded px-2 py-1 font-mono ${selected?.relays?.includes(relay) ? "text-primary" : ""}`}
                  >
                    {relay}
                  </div>
                ))
              ) : (
                <div className="text-sm text-base-content/60">No inbox relays found</div>
              )}
            </div>
          </div>

          {/* Outbox Relays */}
          <div className="w-full">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <span>Outbox Relays ({mailboxes?.outboxes.length || 0})</span>
            </h4>
            <div className="space-y-1">
              {mailboxes?.outboxes && mailboxes.outboxes.length > 0 ? (
                mailboxes.outboxes.map((relay) => (
                  <div
                    key={relay}
                    className={`text-sm bg-base-200 rounded px-2 py-1 font-mono ${selected?.relays?.includes(relay) ? "text-primary" : ""}`}
                  >
                    {relay}
                  </div>
                ))
              ) : (
                <div className="text-sm text-base-content/60">No outbox relays found</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={closeModal}></div>
    </div>
  );
}

function RelayManager({ relays, onChange }: { relays: string[]; onChange: (relays: string[]) => void }) {
  const [input, setInput] = useState<string>("");

  const addRelay: SubmitHandler<any> = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add the relay
    let url = input;
    if (!url.startsWith("wss://") && !url.startsWith("ws://")) url = `wss://${input}`;

    onChange(relaySet(relays, url));
    setInput("");
  };

  const removeRelay = (relay: string) => {
    onChange(relays.filter((r) => r !== relay));
  };

  return (
    <div className="flex flex-col gap-2">
      {relays.map((relay) => (
        <div key={relay} className="flex gap-2 items-center justify-between">
          <div className="text-sm font-mono truncate">{relay}</div>
          <button className="btn btn-square btn-warning btn-soft btn-xs text-lg" onClick={() => removeRelay(relay)}>
            -
          </button>
        </div>
      ))}
      <form className="flex gap-2" onSubmit={addRelay}>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} className="input input-sm flex-1" />
        <button className="btn btn-square btn-primary btn-soft btn-sm text-lg" type="submit" disabled={!input}>
          +
        </button>
      </form>
    </div>
  );
}

// Component to show relay connection and coverage
function RelayConnection({ relay, userCount, totalUsers }: { relay: string; userCount: number; totalUsers: number }) {
  const info = use$(() => pool.relay(relay).information$, [relay]);
  const relayDisplayName = info?.name || relay.replace("wss://", "").replace("ws://", "");
  const coveragePercentage = totalUsers > 0 ? Math.round((userCount / totalUsers) * 100) : 0;

  const instance = useMemo(() => pool.relay(relay), [relay]);
  const connected = use$(() => instance.connected$, [instance]);

  const color = useMemo(() => pastellify(relay, { toCSS: true }), [relay]);
  const icon = use$(() => pool.relay(relay).icon$, [relay]);

  return (
    <div
      className={`flex items-center gap-2 justify-between p-2 hover:bg-base-100 border-l-2 ${connected ? "border-l-success" : " border-l-warning"}`}
    >
      <div className="avatar">
        <div className="w-6 h-6 rounded-full">
          <img src={icon} className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color }}>
          {relayDisplayName}
        </div>
        <div className="text-xs text-base-content/60 truncate">{relay}</div>
      </div>
      <div className="flex flex-col items-end ml-2">
        <div className="text-sm font-medium">{userCount}</div>
        <div className="text-xs text-base-content/60">{coveragePercentage}%</div>
      </div>
    </div>
  );
}

// Component to show unhealthy relay information
function UnhealthyRelay({ relay }: { relay: string }) {
  const relayDisplayName = relay.replace("wss://", "").replace("ws://", "");

  // Get state information from liveness tracker observable
  const state = use$(() => liveness.state(relay), [relay]);

  const color = useMemo(() => pastellify(relay, { toCSS: true }), [relay]);

  const getStateBadge = (state?: RelayHealthState | "unknown") => {
    switch (state) {
      case "dead":
        return "badge-error";
      case "offline":
        return "badge-warning";
      case "online":
        return "badge-success";
      default:
        return "badge-neutral";
    }
  };

  const formatBackoffTime = (ms: number) => {
    if (ms === 0) return "";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const handleRevive = () => {
    liveness.revive(relay);
  };

  // Calculate derived state from the relay state
  const isInBackoff = state?.backoffUntil ? Date.now() < state.backoffUntil : false;
  const backoffRemaining = state?.backoffUntil ? Math.max(0, state.backoffUntil - Date.now()) : 0;

  return (
    <div className="flex items-center gap-2 justify-between p-2 hover:bg-base-100 border-l-2 border-l-error">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color }}>
          {relayDisplayName}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className={`badge badge-sm ${getStateBadge(state?.state || "unknown")}`}>
            {state?.state || "unknown"}
          </div>
          {isInBackoff && backoffRemaining > 0 && (
            <div className="text-xs text-base-content/60">Backoff: {formatBackoffTime(backoffRemaining)}</div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end ml-2">
        {state?.state === "dead" && (
          <button className="btn btn-xs btn-outline btn-error" onClick={handleRevive} title="Revive this relay">
            Revive
          </button>
        )}
        {state?.failureCount && <div className="text-xs text-base-content/60 mt-1">{state.failureCount} failures</div>}
      </div>
    </div>
  );
}

// Main Social Feed Component
export default function SocialFeedExample() {
  const pubkey = useObservableEagerState(pubkey$);
  const maxConnections = useObservableEagerState(maxConnections$);
  const maxRelaysPerUser = useObservableEagerState(maxRelaysPerUser$);

  // Start live and timeline subscriptions on mount (and stop them on unmount)
  useObservable(live$);
  useObservable(timeline$);

  // Select the best relays for the contacts
  const outboxes = use$(contactsWithOutboxes$);
  const selection = use$(() => selection$, [selection$]);
  const outboxMap = use$(() => selection$.pipe(map(createOutboxMap)), [selection$]);

  const byPubkey = useMemo(
    () =>
      selection?.reduce(
        (acc, user) => {
          acc[user.pubkey] = user.relays || [];
          return acc;
        },
        {} as Record<string, string[]>,
      ),
    [selection],
  );

  // Sort relays by popularity (number of users) in descending order
  const sortedRelays = outboxMap ? Object.entries(outboxMap).sort(([, a], [, b]) => b.length - a.length) : [];

  const fallbacks = use$(fallbacks$);

  // Get unhealthy relays from liveness tracker
  const unhealthyRelays = use$(liveness.unhealthy$);

  // Get the timeline from the event store
  const feedEvents = use$(
    () => (selection ? eventStore.timeline({ kinds: [1], authors: selection?.map((s) => s.pubkey) }) : of([])),
    [selection],
  );

  return (
    <div className="flex">
      {/* User Preview Modal */}
      <UserPreviewModal selection={selection} />

      {/* Main Content Area */}
      <div className="flex-1 bg-base-50">
        <div className="max-w-2xl mx-auto">
          {pubkey ? (
            <div className="min-h-screen">
              {/* Feed Header */}
              <div className="sticky top-0 bg-base-50/95 backdrop-blur-sm border-b border-base-300 p-2 mb-4 z-10">
                <h1 className="text-2xl font-bold mb-2">Social Feed</h1>
                <p className="text-base-content/60 text-sm">
                  Connected to {sortedRelays.length} relays • {selection?.length || 0} contacts
                </p>
              </div>

              {/* Feed Content */}
              <div className="bg-base-100 border border-base-300 rounded-lg">
                {feedEvents && feedEvents.length > 0 ? (
                  <div className="divide-y divide-base-300">
                    {feedEvents.slice(0, 100).map((event) => (
                      <Note key={event.id} note={event} selection={byPubkey?.[event.pubkey]} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-base-content/60 mb-4">
                      {feedEvents === undefined ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="loading loading-spinner loading-md"></div>
                          <span>Loading feed...</span>
                        </div>
                      ) : (
                        "No posts found. Try adjusting your relay settings or wait for new posts."
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <h1 className="text-3xl font-bold mb-4">Welcome to Social Feed</h1>
              <p className="text-base-content/60 text-lg">Enter your npub in the sidebar to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-base-100 border-r border-base-300 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-base-300">
          <h2 className="text-xl font-bold mb-4">Social Feed</h2>

          {/* Pubkey Picker */}
          <div className="mb-4">
            <label className="label">
              <span className="label-text">Your npub</span>
            </label>
            <PubkeyPicker
              value={pubkey || ""}
              onChange={(p) => pubkey$.next(p)}
              placeholder="Enter your npub or nostr identifier..."
            />
          </div>
        </div>

        {/* Relay Selection Controls */}
        <div className="p-4 border-b border-base-300">
          <h3 className="text-lg font-semibold mb-4">Relay Settings</h3>

          <div className="space-y-4">
            {/* Max Connections */}
            <div>
              <label className="label">
                <span className="label-text">Max connections</span>
                <span className="label-text-alt">{maxConnections}</span>
              </label>
              <input
                type="range"
                min="1"
                max="200"
                step="1"
                value={maxConnections}
                onChange={(e) => maxConnections$.next(Number(e.target.value))}
                className="range range-primary range-sm"
              />
              <div className="w-full flex justify-between text-xs px-2 text-base-content/60">
                <span>1</span>
                <span>100</span>
                <span>200</span>
              </div>
            </div>

            {/* Max Relays per User */}
            <div>
              <label className="label">
                <span className="label-text">Max per user</span>
                <span className="label-text-alt">{maxRelaysPerUser}</span>
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={maxRelaysPerUser}
                onChange={(e) => maxRelaysPerUser$.next(Number(e.target.value))}
                className="range range-primary range-sm"
              />
              <div className="w-full flex justify-between text-xs px-2 text-base-content/60">
                <span>0</span>
                <span>15</span>
                <span>30</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Issues Section */}
        <UserIssuesSection selection={selection} contacts={outboxes} />

        {/* Selected Relays */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Selected Relays</h3>
            <div className="badge badge-outline">{sortedRelays.length}</div>
          </div>

          <div className="space-y-1 max-h-96 overflow-y-auto">
            {sortedRelays.length === 0 ? (
              <div className="text-center py-4 text-base-content/60">
                {pubkey ? "Loading relays..." : "Enter your npub to view relays"}
              </div>
            ) : (
              sortedRelays.map(([relay, pubkeys]) => (
                <RelayConnection
                  key={relay}
                  relay={relay}
                  userCount={pubkeys.length}
                  totalUsers={selection?.length || 0}
                />
              ))
            )}
          </div>
        </div>

        {/* Extra relays */}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Fallback Relays</h3>
          <p className="text-base-content/60 text-sm mb-4">Used when no relays are available for a user</p>
          <RelayManager relays={fallbacks} onChange={(relays) => fallbacks$.next(relays)} />
        </div>

        {/* Unhealthy Relays Section */}
        {unhealthyRelays && unhealthyRelays.length > 0 && (
          <div className="p-4 border-b border-base-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-error">Unhealthy Relays</h3>
              <div className="badge badge-error">{unhealthyRelays.length}</div>
            </div>

            <div className="space-y-1 max-h-96 overflow-y-auto">
              {unhealthyRelays.map((relay) => (
                <UnhealthyRelay key={relay} relay={relay} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
