/**
 * Nostr IDB Cache for caching events using IndexedDB with nostr-idb for offline support and faster loading
 * @tags cache, indexeddb, offline
 * @related cache/window.nostrdb, feed/relay-timeline
 */
import { Note } from "applesauce-common/casts";
import { castEventStream, castTimelineStream } from "applesauce-common/observable";
import { EventStore, mapEventsToStore } from "applesauce-core";
import { Filter, isFromCache, persistEventsToCache, unixNow } from "applesauce-core/helpers";
import { createEventLoaderForStore, createTimelineLoader } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { NostrIDB } from "nostr-idb";
import { useEffect, useMemo, useState } from "react";
import { BehaviorSubject, combineLatest, debounceTime, interval, startWith, switchMap } from "rxjs";
import RelayPicker from "../../components/relay-picker";

// Open the IndexedDB database
const nostrIDB = new NostrIDB();
await nostrIDB.start();

// Setup event store and relay pool
const eventStore = new EventStore();
const pool = new RelayPool();

// Create cache request function that loads from IndexedDB
function cacheRequest(filters: Filter[]) {
  return nostrIDB.filters(filters);
}

// Create unified event loader for the store
// This will be called if the event store doesn't have the requested event
createEventLoaderForStore(eventStore, pool, {
  cacheRequest,
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com/"],
});

const saved = new BehaviorSubject<string[]>([]);

// Save all new events to the cache
persistEventsToCache(eventStore, async (events) => {
  await Promise.allSettled(
    events.map(async (event) => {
      // add the event to the cache
      await nostrIDB.add(event);
      // add the event id to the saved list
      saved.next([...saved.value, event.id]);
    }),
  );
});

function ReplyLine({ reply }: { reply: Note }) {
  const profile = use$(reply.author.profile$);
  const fromCache = isFromCache(reply.event);
  const isSaved = use$(saved).includes(reply.id);

  return (
    <div>
      <div>Relying to {profile?.displayName || `${reply.author.npub.slice(0, 8)}...`}:</div>
      <div className="text-sm text-base-content/70 truncate">{reply.event.content}</div>
      {fromCache && <div className="text-info">From cache</div>}
      {isSaved && <div className="text-success">Saved to cache</div>}
    </div>
  );
}

// Note card component for kind 1 notes
function NoteCard({ note }: { note: Note }) {
  const profile = use$(note.author.profile$);
  const fromCache = isFromCache(note.event);
  const isSaved = use$(saved).includes(note.id);
  const reply = use$(() => note.replyingTo$.pipe(castEventStream(Note, note.store)), [note.id]);

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        {reply && <ReplyLine reply={reply} />}

        {/* Author info */}
        <div className="flex items-center gap-3 mb-3">
          <img
            className={`size-10 rounded-full outline-2 ${fromCache ? "outline-info" : isSaved ? "outline-success" : ""}`}
            src={profile?.picture || `https://robohash.org/${note.author.pubkey}.png`}
            alt="Profile"
          />
          <div className="flex-1">
            <div className="font-semibold">{profile?.displayName || `${note.author.npub.slice(0, 8)}...`}</div>
            <div className="text-sm text-base-content/70">{note.createdAt.toLocaleString()}</div>
          </div>
          {fromCache && <div className="badge badge-info">From cache</div>}
          {isSaved && <div className="badge badge-success">Saved to cache</div>}
        </div>

        {/* Note content */}
        <div className="whitespace-pre-wrap wrap-break-word">{note.event.content}</div>
      </div>
    </div>
  );
}

function CacheStats() {
  const { notes, profiles } = use$(
    () =>
      interval(5000).pipe(
        startWith(0),
        switchMap(() =>
          combineLatest({
            notes: nostrIDB.count([{ kinds: [1] }]),
            profiles: nostrIDB.count([{ kinds: [0] }]),
          }),
        ),
      ),
    [],
  ) || { notes: 0, profiles: 0 };

  return (
    <div className="stats shadow">
      <div className="stat">
        <div className="stat-title">Notes in Cache</div>
        <div className="stat-value">{notes || 0}</div>
        <div className="stat-desc">Kind 1 events</div>
      </div>

      <div className="stat">
        <div className="stat-title">Profiles in Cache</div>
        <div className="stat-value">{profiles || 0}</div>
        <div className="stat-desc">Kind 0 events</div>
      </div>
    </div>
  );
}

export default function NostrIDBExample() {
  const [live, setLive] = useState(true);
  const [relay, setRelay] = useState("wss://relay.damus.io/");

  // Create a timeline loader that loads from the cache and the relay
  const loader = useMemo(
    () => createTimelineLoader(pool, [relay], { kinds: [1] }, { cache: cacheRequest, eventStore, limit: 50 }),
    [relay],
  );

  // Subscribe to live events from the relay
  use$(
    () =>
      live
        ? pool
            .relay(relay)
            .subscription({ kinds: [1], since: unixNow() })
            .pipe(mapEventsToStore(eventStore))
        : undefined,
    [relay, live],
  );

  // load initial page of events
  useEffect(() => {
    loader().subscribe();
  }, []);

  // Get a timeline of notes from the store
  const notes = use$(() => eventStore.timeline({ kinds: [1] }).pipe(debounceTime(500), castTimelineStream(Note)), []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">nostr-idb Cache Example</h1>
          <div className="badge badge-info badge-sm">
            <span className="loading loading-dots loading-xs mr-1"></span>
            IndexedDB
          </div>
        </div>
        <p className="text-base-content/70">
          Cache Nostr events using nostr-idb with IndexedDB storage for persistent local caching in web browsers.
        </p>
      </div>

      <CacheStats />

      <div className="flex gap-2 mt-2">
        <RelayPicker value={relay} onChange={setRelay} />
        <button className="btn btn-primary" onClick={() => setLive(!live)}>
          {live ? "Stop Live" : "Start Live"}
        </button>
      </div>

      {/* Results */}
      <div className="flex gap-2 flex-col">
        {notes?.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}

        <button className="btn btn-primary mx-auto mt-10" onClick={() => loader().subscribe()}>
          Load More
        </button>
      </div>
    </div>
  );
}
