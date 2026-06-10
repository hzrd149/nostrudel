/**
 * Display notes with user mentions and highlight mentioned users
 * @tags nip-10, nip-77, negentrapy, mentions
 * @related negentrapy/note-reactions, negentrapy/relay-difference
 */
import { defined, EventStore, mapEventsToStore } from "applesauce-core";
import { getDisplayName, getProfilePicture, getSeenRelays, unixNow } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { useObservableEagerState, use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { useMemo, useState } from "react";
import { BehaviorSubject, map, NEVER, of, startWith, switchMap } from "rxjs";
import PubkeyPicker from "../../components/pubkey-picker";

// Create relay pool for connections
const pool = new RelayPool();

// Create event store for keeping local events
const eventStore = new EventStore();

// Create loaders for the event store
// Create unified event loader for the store
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

// Pubkey of user to fetch mentions for
const pubkey$ = new BehaviorSubject<string | null>(null);

// Mailboxes of user to fetch mentions for
const mailboxes$ = pubkey$.pipe(
  defined(),
  switchMap((pubkey) => eventStore.mailboxes(pubkey)),
  startWith(undefined),
);

// Component for displaying a relay badge with NIP-77 support indication
function RelayBadge({ relay }: { relay: string }) {
  const relayInstance = useMemo(() => pool.relay(relay), [relay]);
  const supported = use$(relayInstance.supported$);
  const supportsNIP77 = supported?.includes(77) || false;

  // Get hostname for display
  const hostname = useMemo(() => {
    try {
      return new URL(relay).hostname;
    } catch {
      return relay;
    }
  }, [relay]);

  return (
    <div
      className={`badge badge-sm ${
        supported === undefined ? "badge-neutral animate-pulse" : supportsNIP77 ? "badge-success" : "badge-warning"
      }`}
      title={
        supported === undefined
          ? "Checking NIP-77 support..."
          : supportsNIP77
            ? "Supports NIP-77 (Negentropy)"
            : "Does not support NIP-77 (Negentropy)"
      }
    >
      {hostname}
    </div>
  );
}

// Component for displaying a single mention event
function MentionEvent({ event }: { event: NostrEvent }) {
  const seenRelays = useMemo(() => getSeenRelays(event), [event]);

  // Try to load the profile
  const profile = use$(
    () => eventStore.profile({ pubkey: event.pubkey, relays: seenRelays && Array.from(seenRelays) }),
    [event.pubkey, seenRelays?.size],
  );

  // Format the content to show a preview
  const contentPreview = event.content.length > 200 ? event.content.slice(0, 200) + "..." : event.content;

  return (
    <div className="border-l-2 border-primary/20 pl-4 py-3">
      <div className="flex items-start gap-3">
        <div className="avatar">
          <div className="w-10 h-10 rounded-full">
            <img src={getProfilePicture(profile, `https://robohash.org/${event.pubkey}.png`)} />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold">{getDisplayName(profile, event.pubkey.slice(0, 8) + "...")}</span>
            <span className="text-xs text-base-content/60">{new Date(event.created_at * 1000).toLocaleString()}</span>
          </div>
          <p className="text-sm whitespace-pre-wrap break-words">{contentPreview}</p>
        </div>
      </div>
    </div>
  );
}

// Component for displaying synced mentions
function SyncedMentions({ pubkey, active, since }: { pubkey: string | null; active: boolean; since: number }) {
  // Get mentions from the event store
  const mentions = use$(() => {
    if (!pubkey) return of([]);

    return eventStore
      .timeline({
        "#p": [pubkey],
        since,
      })
      .pipe(
        // Duplicate the timeline array to make react happy and sort by created_at desc
        map((events) => events.filter((e) => e.pubkey !== pubkey)),
      );
  }, [pubkey, since]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold">Synced Mentions</h2>
        <div className="badge badge-primary">{mentions ? mentions.length : 0}</div>
      </div>

      {!mentions || mentions.length === 0 ? (
        <div className="text-center py-8 text-base-content/60">
          {active ? (
            <div className="flex flex-col items-center gap-2">
              <span className="loading loading-spinner loading-lg" />
              <p>Syncing mentions...</p>
            </div>
          ) : (
            <p>No mentions found. Set a pubkey and start a sync to load mentions.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {mentions.map((event: NostrEvent) => (
            <MentionEvent key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

// Main component
export default function MentionsExample() {
  // Time filter options
  const TIME_FILTERS = [
    { label: "Last 6 hours", hours: 6 },
    { label: "Last day", hours: 24 },
    { label: "Last 2 days", hours: 48 },
    { label: "Last week", hours: 168 },
    { label: "Last 2 weeks", hours: 336 },
    { label: "Last month", hours: 720 },
  ];

  const pubkey = useObservableEagerState(pubkey$);
  const mailboxes = use$(mailboxes$);
  const [timeFilter, setTimeFilter] = useState(TIME_FILTERS[1]); // Default to "Last day"

  const since = useMemo(() => unixNow() - timeFilter.hours * 60 * 60, [timeFilter]);

  // Run the sync when its active
  use$(() => {
    if (!pubkey || !mailboxes?.inboxes || mailboxes.inboxes.length === 0) return NEVER;

    const filter: Filter = {
      kinds: [kinds.ShortTextNote],
      "#p": [pubkey],
      since,
    };

    // Run the sync using the user's inbox relays
    return pool.sync(mailboxes.inboxes, eventStore, filter).pipe(
      // Add all events to the event store
      mapEventsToStore(eventStore),
    );
  }, [pubkey, mailboxes, since]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 w-full">
      <h1 className="text-3xl font-bold mb-8">Sync mentions</h1>

      <div className="space-y-4">
        <PubkeyPicker
          value={pubkey || ""}
          onChange={(p) => pubkey$.next(p)}
          placeholder="Enter your pubkey or nostr identifier..."
        />

        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">Time range to sync</span>
          </label>
          <select
            className="select select-bordered"
            value={timeFilter.hours}
            onChange={(e) => {
              const selectedFilter = TIME_FILTERS.find((f) => f.hours === parseInt(e.target.value));
              if (selectedFilter) setTimeFilter(selectedFilter);
            }}
          >
            {TIME_FILTERS.map((filter) => (
              <option key={filter.hours} value={filter.hours}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        {pubkey && !mailboxes && (
          <div className="bg-warning/10 border-l-4 border-warning p-4">
            <h3 className="font-bold text-warning mb-2">Loading Mailboxes...</h3>
            <div className="text-sm">
              <div className="flex items-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                <p>Fetching your NIP-65 relay list...</p>
              </div>
            </div>
          </div>
        )}

        {pubkey && mailboxes && mailboxes.inboxes.length === 0 && (
          <div className="bg-error/10 border-l-4 border-error p-4">
            <h3 className="font-bold text-error mb-2">No Inbox Relays Found</h3>
            <div className="text-sm">
              <p className="mb-2">This user hasn't published a NIP-65 relay list or has no inbox relays configured.</p>
              <p className="text-xs text-base-content/60">
                Without inbox relays, we can't sync mentions for this user. They need to publish their relay preferences
                using a NIP-65 compatible client.
              </p>
            </div>
          </div>
        )}

        {mailboxes && mailboxes.inboxes.length > 0 && (
          <div className="bg-success/10 border-l-4 border-success p-4">
            <h3 className="font-bold text-success mb-2">Inbox Relays Detected - Syncing Mentions</h3>
            <div className="text-sm">
              <div className="mb-3">
                <p className="mb-2">
                  <strong>Inbox relays ({mailboxes.inboxes.length}):</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  {mailboxes.inboxes.map((relay) => (
                    <RelayBadge key={relay} relay={relay} />
                  ))}
                </div>
              </div>
              <p className="mb-1">
                <strong>Time range:</strong> {timeFilter.label}
              </p>
              <p className="text-xs text-base-content/60 mt-2">
                Using inbox relays to sync mentions where this user was tagged in the selected time range.
              </p>
            </div>
          </div>
        )}
      </div>

      <SyncedMentions
        pubkey={pubkey}
        active={!!(pubkey && mailboxes?.inboxes && mailboxes.inboxes.length > 0)}
        since={since}
      />
    </div>
  );
}
