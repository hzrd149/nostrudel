/**
 * Integrate Nostrify library with Applesauce loaders for event loading
 * @tags loader, nostrify, integration
 * @related loader/using-ndk, loader/using-nostr-tools
 */
import { NPool, NRelay1 } from "@nostrify/nostrify";
import { castEvent, Note } from "applesauce-common/casts";
import { EventStore } from "applesauce-core";
import { UpstreamPool } from "applesauce-loaders";
import { createEventLoaderForStore, createTimelineLoader } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { useEffect, useMemo, useState } from "react";
import { from, map, takeWhile } from "rxjs";
import RelayPicker from "../../components/relay-picker";

const pool = new NPool({
  open: (url) => new NRelay1(url),
  reqRouter(_filters) {
    // skip implementing reqRouter for now
    return new Map();
  },
  eventRouter(_event) {
    // skip implementing eventRouter for now
    return [];
  },
});

// Create an event store to hold events
const store = new EventStore();

// Create an adapter for nostrify NPool
const upstream: UpstreamPool = (relays, filters) =>
  // Convert async iterable to observable
  from(pool.req(filters, { relays })).pipe(
    // Complete when EOSE or CLOSED is received
    takeWhile((msg) => msg[0] !== "EOSE" && msg[0] !== "CLOSED"),
    // Select event
    map((msg) => msg[2]),
  );

// Create the necessary loaders for the store to load profiles
createEventLoaderForStore(store, upstream, { lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"] });

function ReplyingTo({ note }: { note: Note }) {
  const profile = use$(note.author.profile$);

  return (
    <p className="text-sm text-base-content/60 mb-2">
      Replying to <span className="font-semibold">{profile?.displayName ?? note.author.npub.slice(0, 8) + "..."}</span>{" "}
      <span className="italic line-clamp-1">{note.event.content}</span>
      <span className="text-xs text-base-content/60">{note.createdAt.toLocaleString()}</span>
    </p>
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
          <h2 className="card-title">{profile?.displayName ?? note.author.npub.slice(0, 8) + "..."}</h2>
        </div>
        <p>{note.event.content}</p>
      </div>
    </div>
  );
}

export default function UsingNostrifyExample() {
  const [relay, setRelay] = useState("wss://relay.damus.io/");
  const loader = useMemo(
    () => createTimelineLoader(upstream, [relay], [{ kinds: [1] }], { eventStore: store, limit: 20 }),
    [relay],
  );

  // Load initial page of events
  useEffect(() => {
    loader().subscribe();
  }, [loader]);

  // Load the next page of events
  const loadMore = () => loader().subscribe();

  // Subscribe to a timeline of events from the store
  const events = use$(store.timeline({ kinds: [1] }));

  // Cast events to Notes
  const notes = useMemo(() => {
    if (!events) return [];
    return events.map((event) => castEvent(event, Note, store));
  }, [events]);

  return (
    <div className="container mx-auto my-8 px-4">
      <RelayPicker value={relay} onChange={setRelay} />

      <div className="flex flex-col gap-4 py-4">
        {notes.map((note) => (
          <NoteEvent key={note.id} note={note} />
        ))}
      </div>

      {notes.length > 0 && (
        <div className="flex justify-center py-4">
          <button className="btn btn-primary" onClick={loadMore}>
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
