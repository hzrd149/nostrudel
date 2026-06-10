/**
 * Display a real-time timeline of notes from a selected relay with caching support
 * @tags feed, timeline, relay, cache
 * @related feed/reactions-timeline, feed/loading-reactions
 */
import { castEvent, Note } from "applesauce-common/casts";
import { castTimelineStream } from "applesauce-common/observable";
import { EventStore, mapEventsToStore, mapEventsToTimeline } from "applesauce-core";
import { Filter, getDisplayName, persistEventsToCache } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { addEvents, getEventsForFilters, openDB } from "nostr-idb";
import { useState } from "react";
import RelayPicker from "../../components/relay-picker";

// Create an event store for all events
const eventStore = new EventStore();

// Create a relay pool to make relay connections
const pool = new RelayPool();

const cache = await openDB();
function cacheRequest(filters: Filter[]) {
  return getEventsForFilters(cache, filters);
}
persistEventsToCache(eventStore, (events) => addEvents(cache, events));

// Create unified event loader for the store
// This will be called if the event store doesn't have the requested event
createEventLoaderForStore(eventStore, pool, {
  cacheRequest,
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com/"],
});

function ReplyingTo({ note }: { note: Note }) {
  const profile = use$(note.author.profile$);
  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + "...";
  };

  return (
    <div className="mb-4 p-3 bg-base-200 rounded-lg border-l-4 border-primary">
      <div className="flex items-center gap-2 mb-2">
        <div className="avatar">
          <div className="w-8 rounded-full">
            <img src={profile?.picture ?? `https://robohash.org/${note.author.pubkey}.png`} alt="Replying to profile" />
          </div>
        </div>
        <span className="text-sm font-semibold text-base-content/70">Replying to {getDisplayName(profile)}</span>
      </div>
      <p className="text-sm text-base-content/60 italic">{truncateContent(note.event.content)}</p>
    </div>
  );
}

function NoteEvent({ note }: { note: Note }) {
  const profile = use$(note.author.profile$);
  const replyingToEvent = use$(note.replyingTo$);
  const replyingToNote = replyingToEvent ? castEvent(replyingToEvent, Note, note.store) : null;

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        {replyingToNote && <ReplyingTo note={replyingToNote} />}
        <div className="flex items-center gap-4">
          <div className="avatar">
            <div className="w-12 rounded-full">
              <img src={profile?.picture ?? `https://robohash.org/${note.author.pubkey}.png`} alt="Profile" />
            </div>
          </div>
          <h2 className="card-title">{getDisplayName(profile)}</h2>
        </div>
        <p>{note.event.content}</p>
      </div>
    </div>
  );
}

export default function RelayTimeline() {
  const [relay, setRelay] = useState("wss://relay.devvul.com");

  // Create a timeline observable
  const events = use$(
    () =>
      pool
        .relay(relay)
        .subscription({ kinds: [1] })
        .pipe(
          // deduplicate events using the event store
          mapEventsToStore(eventStore),
          // collect all events into a timeline
          mapEventsToTimeline(),
          // Cast events to Notes
          castTimelineStream(Note),
        ),
    [relay],
  );

  return (
    <div className="container mx-auto my-8 px-4">
      <RelayPicker value={relay} onChange={setRelay} />

      <div className="flex flex-col gap-4 py-4">
        {events?.map((note) => (
          <NoteEvent key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
}
