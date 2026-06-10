/**
 * Integrate NDK (Nostr Development Kit) with Applesauce loaders for event loading
 * @tags loader, ndk, integration
 * @related loader/using-nostrify, loader/using-nostr-tools
 */
import NDK from "@nostr-dev-kit/ndk";
import { castEvent, Note } from "applesauce-common/casts";
import { EventStore } from "applesauce-core";
import { UpstreamPool } from "applesauce-loaders";
import { createEventLoaderForStore, createTimelineLoader } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { useEffect, useMemo, useState } from "react";
import { from, map, switchMap } from "rxjs";
import RelayPicker from "../../components/relay-picker";

const ndk = new NDK();
await ndk.connect();

// Create an event store to hold events
const store = new EventStore();

// Create an adapter for NDK
const upstream: UpstreamPool = (relays, filters) =>
  from(ndk.fetchEvents(filters, { relayUrls: relays })).pipe(
    // Emit each event individually
    switchMap((events) => from(events)),
    // Get raw event from NDKEvent
    map((event) => event.rawEvent()),
  );

// Create the nessisary loaders for the store to load profiles
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

export default function UsingNDKExample() {
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
