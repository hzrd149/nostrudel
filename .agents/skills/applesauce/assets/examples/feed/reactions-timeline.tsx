/**
 * Display a timeline of reactions (likes, reposts) with user profiles and caching
 * @tags nip-25, feed, timeline, reactions, cache
 * @related feed/loading-reactions, feed/relay-timeline
 */
import { castUser, Reaction, User } from "applesauce-common/casts";
import { castTimelineStream } from "applesauce-common/observable";
import { EventStore, mapEventsToStore, mapEventsToTimeline } from "applesauce-core";
import { encodePointer, persistEventsToCache } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { addEvents, getEventsForFilters, openDB } from "nostr-idb";
import { Filter, kinds } from "nostr-tools";
import { useMemo, useState } from "react";
import RelayPicker from "../../components/relay-picker";

// Setup event store
const eventStore = new EventStore();

// Create a relay pool for connections
const pool = new RelayPool();

// Setup a local event cache
const cache = await openDB();
function cacheRequest(filters: Filter[]) {
  return getEventsForFilters(cache, filters).then((events) => {
    console.log("loaded events from cache", events.length);
    return events;
  });
}

// Save all new events to the cache
persistEventsToCache(eventStore, (events) => addEvents(cache, events));

// Create unified event loader for the store
// This will be called if the event store doesn't have the requested event
createEventLoaderForStore(eventStore, pool, {
  cacheRequest,
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com/"],
});

/** A component for rendering user avatars */
function Avatar({ user }: { user: User }) {
  const picture = use$(user.profile$.picture);

  return (
    <div className="avatar">
      <div className="w-8 rounded-full">
        <img src={picture || `https://robohash.org/${user.pubkey}.png`} />
      </div>
    </div>
  );
}

/** A component for rendering usernames */
function Username({ user }: { user: User }) {
  const displayName = use$(user.profile$.displayName);

  return <>{displayName || user.pubkey.slice(0, 8) + "..."}</>;
}

function ReactionEvent({ reaction }: { reaction: Reaction }) {
  const pointer = reaction.reactedPointer;
  const reactedTo = use$(reaction.reactedTo$);
  const reactedToUser = useMemo(() => reactedTo && castUser(reactedTo, eventStore), [reactedTo]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <Avatar user={reaction.author} />
        <h2>
          <span className="font-bold">
            <Username user={reaction.author} />
          </span>
          <span> reacted {reaction.content} to</span>
        </h2>
        <time className="ms-auto text-sm text-gray-500">{reaction.createdAt.toLocaleString()}</time>
      </div>

      {reactedTo ? (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            {reactedToUser && (
              <div className="flex items-center gap-4">
                <Avatar user={reactedToUser} />
                <h2 className="card-title">
                  <Username user={reactedToUser} />
                </h2>
              </div>
            )}
            <p>{reactedTo.content}</p>
          </div>
        </div>
      ) : pointer ? (
        <div className="card bg-base-200 shadow-md opacity-50">
          <div className="card-body overflow-hidden">
            <div className="flex items-center gap-4">
              <span className="loading loading-dots loading-lg" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-mono">{encodePointer(pointer)}</p>
                {pointer.relays && pointer.relays.length > 0 && (
                  <p className="text-xs text-gray-500">Checking relays: {pointer.relays.join(", ")}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ReactionsTimeline() {
  const [relay, setRelay] = useState<string>("wss://relay.primal.net/");

  const reactions = use$(
    () =>
      pool
        .relay(relay)
        .subscription({ kinds: [kinds.Reaction], limit: 20 })
        .pipe(
          // Add all events to the store
          mapEventsToStore(eventStore),
          // Gather events into a timeline
          mapEventsToTimeline(),
          // Create reaction classes for events
          castTimelineStream(Reaction),
        ),
    [relay],
  );

  return (
    <div className="max-w-4xl mx-auto my-8">
      <div className="flex gap-2 mb-4">
        <RelayPicker value={relay} onChange={setRelay} />
      </div>

      <div className="flex flex-col gap-4">
        {reactions?.map((reaction) => (
          <ReactionEvent key={reaction.id} reaction={reaction} />
        ))}
      </div>
    </div>
  );
}
