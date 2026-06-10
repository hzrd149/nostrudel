/**
 * Display reactions (likes, reposts) on notes with user information
 * @tags nip-25, nip-77, negentrapy, reactions, notes
 * @related negentrapy/mentions, feed/reactions-timeline
 */
import { EventStore, mapEventsToStore } from "applesauce-core";
import { getDisplayName, getProfilePicture, getSeenRelays } from "applesauce-core/helpers";
import { useObservableEagerState, use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { decode, EventPointer, neventEncode } from "nostr-tools/nip19";
import { useCallback, useMemo, useState } from "react";
import { useDebounce } from "react-use";
import { BehaviorSubject, map, NEVER, of } from "rxjs";
import RelayAddForm from "../../components/add-relay-form";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";

// Create a relay pool for connections
const pool = new RelayPool();

// Create an event store for keeping local events
const eventStore = new EventStore();

// Create loaders for the event store
// Create unified event loader for the store
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

// Configured relays to sync with (using BehaviorSubject for dynamic management)
const relays$ = new BehaviorSubject<string[]>([
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://purplepag.es",
  "wss://relay.primal.net",
]);

// An array of popular notes to use as examples
const EXAMPLE_NOTES = [
  {
    label: "Jack's note",
    nevent:
      "nevent1qqsq86m48fhprxp7q82f7uktpwl6wcasc4rxm9y3tz2j8ju7jxnuwagzyzprg8ug9dh2hnft5lc7ly92m9su7p6279deaaz2p8ua928ml0n2yqcyqqqqqqgfhfpea",
  },
  {
    label: "Jack's other note",
    nevent:
      "nevent1qqs9gt64cv5y30gsk9wtpdyth36vdxp5ea2fqz8zxl8z2mu467wkmfgzyzprg8ug9dh2hnft5lc7ly92m9su7p6279deaaz2p8ua928ml0n2yqcyqqqqqqgkp9z33",
  },
  {
    label: "Gigi's note",
    nevent:
      "nevent1qqswjjky9u0sntsxlfaha2hwrx0zn4ky25mnpzse37yu4kgkynuengszyphydppzm7m554ecwq4gsgaek2qk32atse2l4t9ks57dpms4mmhfxqcyqqqqqqgs4jzvv",
  },
];

// Component for event selection with input and dropdown
function EventSelector({
  pointer,
  onChange,
}: {
  pointer: EventPointer | null;
  onChange: (pointer: EventPointer | null) => void;
}) {
  const [text, setText] = useState(pointer ? neventEncode(pointer) : "");

  const change = useCallback(
    (str: string) => {
      try {
        const decoded = decode(str);
        if (decoded.type === "nevent") onChange(decoded.data);
        else onChange(null);
      } catch (err) {
        onChange(null);
      }
    },
    [onChange],
  );

  // Debounce the user input
  useDebounce(() => change(text), 500, [text]);

  return (
    <div className="space-y-2">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Event nevent1 address</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Paste nevent1... here"
            className="input input-bordered flex-1"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <select
            className="select select-bordered"
            value={text}
            onChange={(e) => {
              if (e.target.value) {
                setText(e.target.value);
                change(e.target.value);
              } else onChange(null);
            }}
          >
            <option value="">Choose example</option>
            {EXAMPLE_NOTES.map((example, index) => (
              <option key={index} value={example.nevent}>
                {example.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {pointer && (
        <div className="bg-info/10 border-l-4 border-info p-4">
          <h3 className="font-bold text-info">Event parsed successfully!</h3>
          <div className="text-sm font-mono mt-2">
            <p>ID: {pointer.id}</p>
            {pointer.relays && pointer.relays.length > 0 && <p>Relays: {pointer.relays.join(", ")}</p>}
          </div>
        </div>
      )}

      {text && !pointer && (
        <div className="bg-error/10 border-l-4 border-error p-4">
          <span className="text-error">Invalid nevent address. Please check the format.</span>
        </div>
      )}
    </div>
  );
}

// Component for displaying a single relay's status
function RelayStatusRow({ relay }: { relay: string }) {
  const relayInstance = useMemo(() => pool.relay(relay), [relay]);
  const connected = use$(() => relayInstance.connected$, [relayInstance]);
  const supported = use$(relayInstance.supported$);
  const supportsNIP77 = supported?.includes(77) || false;

  // Create observable to count number of reactions received from the relay
  const received = use$(
    () =>
      eventStore
        .timeline({ kinds: [kinds.Reaction] })
        .pipe(map((events) => events.filter((e) => getSeenRelays(e)?.has(relay)).length)),
    [eventStore, relay],
  );

  const removeRelay = () => {
    const currentRelays = relays$.value;
    relays$.next(currentRelays.filter((r) => r !== relay));
  };

  return (
    <tr>
      <td className="font-mono text-sm">{relay}</td>
      <td>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              connected === null ? "bg-base-300 animate-pulse" : connected ? "bg-success" : "bg-error"
            }`}
          />
          {connected === null ? "Connecting..." : connected ? "Connected" : "Disconnected"}
        </div>
      </td>
      <td>
        {supported === undefined ? (
          <span className="loading loading-spinner loading-sm" />
        ) : supportsNIP77 ? (
          <div className="badge badge-success">Yes</div>
        ) : (
          <div className="badge badge-error">No</div>
        )}
      </td>
      <td>
        <div className="badge badge-primary">{received ?? 0}</div>
      </td>
      <td>
        <button className="btn btn-error btn-xs btn-ghost" onClick={removeRelay} title="Remove relay">
          Remove
        </button>
      </td>
    </tr>
  );
}

// Component for the relay status table
function RelayStatusTable() {
  const relays = useObservableEagerState(relays$);

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th>Relay</th>
            <th>Status</th>
            <th>NIP-77 Support</th>
            <th>Events Received</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {relays.map((relay) => (
            <RelayStatusRow key={relay} relay={relay} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Component for displaying a single reaction event
function ReactionEvent({ event }: { event: NostrEvent }) {
  // Get relays the event was from
  const seenRelays = useMemo(() => getSeenRelays(event), [event]);

  // Try to load the profile from those relays
  const profile = use$(
    () => eventStore.profile({ pubkey: event.pubkey, relays: seenRelays && Array.from(seenRelays) }),
    [event.pubkey, seenRelays?.size],
  );

  return (
    <div className="border-l-2 border-primary/20 pl-4 py-2">
      <div className="flex items-start gap-3">
        <div className="avatar">
          <div className="w-8 h-8 rounded-full">
            <img src={getProfilePicture(profile, `https://robohash.org/${event.pubkey}.png`)} />
          </div>
        </div>
        <div className="flex w-full gap-2 flex-wrap items-center">
          <span className="font-bold">{getDisplayName(profile)}</span>
          <p className="text-lg flex-1">{event.content}</p>
          {seenRelays &&
            seenRelays.size > 0 &&
            Array.from(seenRelays).map((relay) => (
              <div key={relay} className="badge badge-outline badge-xs">
                {new URL(relay).hostname}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// Component for displaying synced events
function SyncedReactions({ pointer, active }: { pointer: EventPointer | null; active: boolean }) {
  // Get reactions from the event store
  const reactions = use$(() => {
    if (!pointer) return of([]);

    return eventStore.timeline({
      kinds: [kinds.Reaction],
      "#e": [pointer.id],
    });
  }, [pointer?.id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold">Synced Reactions</h2>
        <div className="badge badge-primary">{reactions ? reactions.length : 0}</div>
      </div>

      {!reactions || reactions.length === 0 ? (
        <div className="text-center py-8 text-base-content/60">
          {active ? (
            <div className="flex flex-col items-center gap-2">
              <span className="loading loading-spinner loading-lg" />
              <p>Syncing reactions...</p>
            </div>
          ) : (
            <p>No reactions found. Start a sync to load reactions.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {reactions.map((event: NostrEvent) => (
            <ReactionEvent key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

// Main component
export default function PoolSyncReactions() {
  const [pointer, setPointer] = useState<EventPointer | null>(null);

  const relays = useObservableEagerState(relays$);

  // Run the sync when its active
  use$(() => {
    if (!pointer || relays.length === 0) return NEVER;

    const filter: Filter = {
      kinds: [kinds.Reaction],
      "#e": [pointer.id],
    };

    // Otherwise run the sync
    return pool.sync(relays, eventStore, filter).pipe(
      // Add all events to the event store
      mapEventsToStore(eventStore),
    );
  }, [relays, pointer]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4 w-full">
      <h1 className="text-3xl font-bold mb-8">Negentropy Note Reactions</h1>

      <EventSelector pointer={pointer} onChange={setPointer} />

      <RelayStatusTable />
      <RelayAddForm onSubmit={(r) => relays$.value.includes(r) || relays$.next([...relays$.value, r])} />

      <SyncedReactions pointer={pointer} active={!!pointer} />
    </div>
  );
}
