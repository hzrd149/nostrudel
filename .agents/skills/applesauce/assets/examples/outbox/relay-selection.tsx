/**
 * Select optimal relays for publishing events based on mailbox discovery
 * @tags nip-65, outbox, relay, selection
 * @related outbox/social-feed, relay-discovery/contacts-relays
 */
import { defined, EventStore, includeMailboxes } from "applesauce-core";
import { getDisplayName, getProfilePicture, groupPubkeysByRelay, selectOptimalRelays } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$, useObservableEagerState } from "applesauce-react/hooks";
import { ignoreUnhealthyRelaysOnPointers, RelayHealthState, RelayLiveness, RelayPool } from "applesauce-relay";
import localforage from "localforage";
import { ProfilePointer } from "nostr-tools/nip19";
import pastellify from "pastellify";
import { Fragment, useCallback, useMemo, useState } from "react";
import { BehaviorSubject, firstValueFrom, shareReplay, switchMap, throttleTime } from "rxjs";

import PubkeyPicker from "../../components/pubkey-picker";
import { RelayStatusModal } from "../../components/relay-status-popover";

// The pubkey of the user to view
const pubkey$ = new BehaviorSubject<string | null>(null);

// Create an event store and event pool
const pool = new RelayPool();
const eventStore = new EventStore();

// Create some loaders using the cache method and the event store
// Create unified event loader for the store
// This will be called if the event store doesn't have the requested event
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com/", "wss://indexer.coracle.social/"],
  extraRelays: ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"],
});

// Create a liveness tracker and connect to the pool
const liveness = new RelayLiveness({
  storage: localforage.createInstance({ name: "liveness" }),
});
await liveness.load();
liveness.connectToPool(pool);

/** Subject for previewing a user */
const preview$ = new BehaviorSubject<ProfilePointer | null>(null);

/** A list of users contacts */
const contacts$ = pubkey$.pipe(
  defined(),
  switchMap((pubkey) => eventStore.contacts(pubkey)),
);

// User Preview Modal Component
function UserPreviewModal({ selection }: { selection?: ProfilePointer[] }) {
  const previewUser = use$(preview$);
  const [refreshing, setRefreshing] = useState(false);

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

  const refresh = useCallback(async () => {
    if (!previewUser) return;

    setRefreshing(true);
    try {
      await firstValueFrom(
        eventStore.replaceable({ kind: 10002, pubkey: previewUser.pubkey, relays: previewUser.relays }),
      );
    } catch (error) {
      console.error("Failed to refresh mailboxes for user", previewUser.pubkey);
    }
    setRefreshing(false);
  }, [previewUser]);

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
            <button
              className={`btn btn-secondary btn-soft ${refreshing ? "loading" : ""}`}
              onClick={refresh}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh Mailboxes"}
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

// User Avatar Component
function UserAvatar({ user }: { user: ProfilePointer }) {
  const profile = use$(() => eventStore.profile(user), [user.pubkey]);
  const mailboxes = use$(() => eventStore.mailboxes(user), [user.pubkey]);

  const displayName = getDisplayName(profile, user.pubkey.slice(0, 8) + "...");
  const avatarUrl = getProfilePicture(profile, `https://robohash.org/${user.pubkey}.png`);

  const handleClick = () => {
    preview$.next(user);
  };

  return (
    <div
      className="flex flex-col items-center gap-1 p-2 hover:bg-base-200 rounded-lg transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="avatar">
        <div className="w-10 h-10 rounded-full">
          <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="text-xs max-w-16 overflow-hidden flex items-center justify-center gap-1">
        <div className="truncate">{displayName}</div>
        <div className="text-base-content/60">
          {mailboxes?.inboxes.length || 0}/{mailboxes?.outboxes.length || 0}
        </div>
      </div>
    </div>
  );
}

// Relay Row Component
function RelayRow({ relay, users, totalUsers }: { relay: string; users: ProfilePointer[]; totalUsers: number }) {
  const [expanded, setExpanded] = useState(false);
  const info = use$(() => pool.relay(relay).information$, [relay]);
  const relayDisplayName = info?.name || relay.replace("wss://", "").replace("ws://", "");
  const icon = use$(() => pool.relay(relay).icon$, [relay]);

  return (
    <tr>
      <td colSpan={3} className="p-0">
        <div className="w-full">
          {/* Relay header row */}
          <div
            className="flex items-center justify-between p-4 hover:bg-base-100 cursor-pointer transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center gap-3">
              <div className="text-lg">{expanded ? "▼" : "▶"}</div>
              <div className="avatar">
                <div className="w-10 h-10 rounded-full">
                  <img src={icon} className="w-full h-full object-cover" />
                </div>
              </div>
              <div>
                <div className="font-medium">{relayDisplayName}</div>
                <div className="text-sm text-base-content/60">{relay}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="badge badge-primary">{users.length} users</div>
              <div className="badge badge-outline">
                {totalUsers > 0 ? Math.round((users.length / totalUsers) * 100) : 0}%
              </div>
            </div>
          </div>

          {/* Expanded user avatars */}
          {expanded && (
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <UserAvatar key={user.pubkey} user={user} />
                ))}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
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
    <div className="flex items-center gap-2  p-2 hover:bg-base-100 border-l-2 border-l-error">
      <div className="text-sm font-medium truncate" style={{ color }}>
        {relayDisplayName}
      </div>
      <div className="flex items-center gap-2">
        <div className={`badge badge-sm ${getStateBadge(state?.state || "unknown")}`}>{state?.state || "unknown"}</div>
        {isInBackoff && backoffRemaining > 0 && (
          <div className="text-xs text-base-content/60">Backoff: {formatBackoffTime(backoffRemaining)}</div>
        )}
      </div>
      {state?.failureCount && <div className="text-xs text-base-content/60">{state.failureCount} failures</div>}
      {state?.state === "dead" && (
        <button className="btn btn-xs btn-outline btn-error ms-auto" onClick={handleRevive} title="Revive this relay">
          Revive
        </button>
      )}
    </div>
  );
}

// Unhealthy Relays Component
function UnhealthyRelays() {
  const unhealthyRelays = use$(liveness.unhealthy$);

  if (!unhealthyRelays || unhealthyRelays.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
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
  );
}

// Users by Relay Count Component
function UsersByRelayCount({
  selection,
  contacts,
}: {
  selection: ProfilePointer[] | null | undefined;
  contacts: ProfilePointer[] | null | undefined;
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

  // Group users by relay count - always call this hook
  const usersByRelayCount = useMemo(() => {
    if (!selection) return {};

    const groups: { [relayCount: number]: ProfilePointer[] } = {};

    selection.forEach((user) => {
      const relayCount = user.relays?.length || 0;
      if (!groups[relayCount]) groups[relayCount] = [];

      groups[relayCount].push(user);
    });

    // Sort users within each group by pubkey for consistent ordering
    Object.values(groups).forEach((group) => {
      group.sort((a, b) => a.pubkey.localeCompare(b.pubkey));
    });

    return groups;
  }, [selection]);

  // Sort relay counts ascending (users with least relays first) - always call this hook
  const sortedRelayCounts = useMemo(() => {
    return Object.keys(usersByRelayCount)
      .map(Number)
      .sort((a, b) => a - b);
  }, [usersByRelayCount]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  if (!selection) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Users by Relay Count</h2>
        <p className="text-base-content/60">No data available</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Users by Relay Count</h2>
      <p className="text-base-content/60 mb-6">
        All users grouped by how many relays have been selected for them. Click rows to expand and see users.
      </p>

      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Relay Count</th>
              <th>Users</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {sortedRelayCounts.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-12 text-base-content/60">
                  No relay count data available
                </td>
              </tr>
            ) : (
              <>
                {/* Missing Relays Section */}
                {missingRelaysUsers.length > 0 && (
                  <>
                    <tr className="hover:bg-base-200 cursor-pointer" onClick={() => toggleSection("missing-relays")}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="text-lg">{expandedSections.has("missing-relays") ? "▼" : "▶"}</div>
                          <span className="font-medium text-warning">Missing Relays</span>
                        </div>
                      </td>
                      <td>
                        <div className="badge badge-warning">{missingRelaysUsers.length}</div>
                      </td>
                      <td>
                        <span className="text-sm text-base-content/80">
                          Users without any relays (no NIP-65 relay list published)
                        </span>
                      </td>
                    </tr>

                    {expandedSections.has("missing-relays") && (
                      <tr>
                        <td colSpan={3} className="p-0">
                          <div className="bg-base-100 p-4">
                            <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
                              {missingRelaysUsers.map((user) => (
                                <UserAvatar key={user.pubkey} user={user} />
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}

                {/* Orphaned Users Section */}
                {orphanedUsers.length > 0 && (
                  <>
                    <tr className="hover:bg-base-200 cursor-pointer" onClick={() => toggleSection("orphaned-users")}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="text-lg">{expandedSections.has("orphaned-users") ? "▼" : "▶"}</div>
                          <span className="font-medium text-error">Orphaned Users</span>
                        </div>
                      </td>
                      <td>
                        <div className="badge badge-error">{orphanedUsers.length}</div>
                      </td>
                      <td>
                        <span className="text-sm text-base-content/80">
                          Users who lost all relays after selection process
                        </span>
                      </td>
                    </tr>

                    {expandedSections.has("orphaned-users") && (
                      <tr>
                        <td colSpan={3} className="p-0">
                          <div className="bg-base-100 p-4">
                            <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
                              {orphanedUsers.map((user) => (
                                <UserAvatar key={user.pubkey} user={user} />
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}

                {/* Regular Relay Count Sections */}
                {sortedRelayCounts
                  .filter((relayCount) => relayCount > 0) // Exclude 0 relay count since we handle it separately
                  .map((relayCount) => {
                    const users = usersByRelayCount[relayCount];
                    const sectionId = `relay-count-${relayCount}`;
                    const isExpanded = expandedSections.has(sectionId);

                    const getDescription = (count: number): string => {
                      if (count === 1) return "High risk - single point of failure";
                      if (count <= 3) return "Limited redundancy - may have connectivity issues";
                      if (count <= 5) return "Good coverage with reasonable redundancy";
                      return "Excellent coverage with high redundancy";
                    };

                    return (
                      <Fragment key={relayCount}>
                        <tr className="hover:bg-base-200 cursor-pointer" onClick={() => toggleSection(sectionId)}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="text-lg">{isExpanded ? "▼" : "▶"}</div>
                              <span className="font-medium">
                                {relayCount === 1 ? "1 Relay" : `${relayCount} Relays`}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="badge badge-neutral">{users.length}</div>
                          </td>
                          <td>
                            <span className="text-sm text-base-content/80">{getDescription(relayCount)}</span>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={3} className="p-0">
                              <div className="bg-base-100 p-4">
                                <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
                                  {users.map((user) => (
                                    <UserAvatar key={user.pubkey} user={user} />
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary at the bottom */}
      <div className="mt-6 p-4 bg-base-200 rounded-lg">
        <div className="text-sm text-base-content/70">
          <strong>{selection.length}</strong> total users distributed across relay count groups
        </div>
        {(missingRelaysUsers.length > 0 || orphanedUsers.length > 0) && (
          <div className="text-xs text-base-content/60 mt-2">
            <div className="flex flex-wrap gap-4">
              {missingRelaysUsers.length > 0 && (
                <span className="text-warning">
                  <strong>{missingRelaysUsers.length}</strong> users missing relays (no NIP-65 published)
                </span>
              )}
              {orphanedUsers.length > 0 && (
                <span className="text-error">
                  <strong>{orphanedUsers.length}</strong> users orphaned (lost relays after selection)
                </span>
              )}
            </div>
          </div>
        )}
        {sortedRelayCounts.length > 0 && (
          <div className="text-xs text-base-content/60 mt-1">
            Active relay range: {Math.min(...sortedRelayCounts.filter((c) => c > 0))} - {Math.max(...sortedRelayCounts)}{" "}
            relays per user
          </div>
        )}
      </div>
    </div>
  );
}

// Main Component
export default function RelaySelectionExample() {
  const pubkey = useObservableEagerState(pubkey$);
  const [maxConnections, setMaxConnections] = useState(30);
  const [maxRelaysPerUser, setMaxRelaysPerUser] = useState(8);
  const [showRelayStatus, setShowRelayStatus] = useState(false);

  // Get pool status for the button
  const poolStatuses = use$(pool.status$);

  // Create an observable for adding relays to the contacts
  const outboxes$ = useMemo(
    () =>
      contacts$.pipe(
        defined(),
        // Load the NIP-65 outboxes for all contacts
        includeMailboxes(eventStore),
        // Ignore unhealthy relays from the liveness tracker
        ignoreUnhealthyRelaysOnPointers(liveness),
        // Only recalculate every 200ms
        throttleTime(200),
        // Only calculate it once
        shareReplay(1),
      ),
    [eventStore, liveness],
  );

  const original = use$(outboxes$);

  // Get grouped outbox data
  const selection = useMemo(() => {
    if (!original) return [];

    console.info("Selecting optimal relays", original.length);
    return selectOptimalRelays(original, { maxConnections, maxRelaysPerUser });
  }, [original, maxConnections, maxRelaysPerUser]);

  const outboxMap = useMemo(() => selection && groupPubkeysByRelay(selection), [selection]);

  const sortedRelays = outboxMap ? Object.entries(outboxMap).sort(([, a], [, b]) => b.length - a.length) : [];

  return (
    <div className="min-h-screen p-4">
      {/* User Preview Modal */}
      <UserPreviewModal selection={selection} />

      {/* Relay Status Modal */}
      <RelayStatusModal pool={pool} isOpen={showRelayStatus} onClose={() => setShowRelayStatus(false)} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Outbox Relay Selection</h1>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <PubkeyPicker
          value={pubkey || ""}
          onChange={(p) => pubkey$.next(p)}
          placeholder="Enter pubkey or nostr identifier..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col w-full">
            <label className="label pb-1">
              <span className="label-text">Max connections: {maxConnections}</span>
            </label>
            <input
              type="range"
              min="1"
              max="200"
              step="1"
              value={maxConnections}
              onChange={(e) => setMaxConnections(Number(e.target.value))}
              className="range range-primary range-sm w-full"
            />
            <div className="w-full flex justify-between text-xs px-2 text-base-content/60">
              <span>1</span>
              <span>100</span>
              <span>200</span>
            </div>
          </div>

          <div className="flex flex-col w-full">
            <label className="label pb-1">
              <span className="label-text">Max relays per user: {maxRelaysPerUser}</span>
            </label>
            <input
              type="range"
              min="0"
              max="30"
              value={maxRelaysPerUser}
              onChange={(e) => setMaxRelaysPerUser(Number(e.target.value))}
              className="range range-primary range-sm w-full"
            />
            <div className="w-full flex justify-between text-xs px-2 text-base-content/60">
              <span>0</span>
              <span>15</span>
              <span>30</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th colSpan={3} className="text-left">
                <div className="flex items-center justify-between">
                  <span className="text-lg">Relays ({sortedRelays.length})</span>
                  <button className="btn btn-sm btn-ghost gap-2" onClick={() => setShowRelayStatus(true)}>
                    <span className="text-xs">Status:</span>
                    <div className="badge badge-sm badge-primary">
                      {Object.values(poolStatuses || {}).filter((s) => s.ready).length}/
                      {Object.keys(poolStatuses || {}).length}
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRelays.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-12 text-base-content/60">
                  {pubkey ? "Loading..." : "Enter a pubkey to view relay data"}
                </td>
              </tr>
            ) : (
              sortedRelays.map(([relay, users]) => (
                <RelayRow key={relay} relay={relay} users={users} totalUsers={selection?.length || 0} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Users by Relay Count Report */}
      <UsersByRelayCount selection={selection} contacts={original} />

      {/* Unhealthy Relays Section */}
      <UnhealthyRelays />
    </div>
  );
}
