/**
 * Display a timeline of kind 1 notes with zaps loaded per note via createZapsLoader.
 * @tags nip-57, zap, timeline, loading, loader
 * @related feed/loading-reactions, zap/timeline, zap/zap-modal
 */
import { Note, User, Zap } from "applesauce-common/casts";
import { castTimelineStream } from "applesauce-common/observable";
import { castUser, EventStore } from "applesauce-core";
import { normalizeToPubkey } from "applesauce-core/helpers";
import { createEventLoaderForStore, createTimelineLoader, createZapsLoader } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { useEffect, useMemo, useState } from "react";

import PubkeyPicker from "../../components/pubkey-picker";

// Create an event store for all events
const eventStore = new EventStore();

// Create a relay pool to make relay connections
const pool = new RelayPool();

// Create a unified event loader for the store (used to fetch profiles, zapped events, etc.)
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com", "wss://indexer.coracle.social"],
});

// Create a loader that fetches zap receipts (kind 9735) for any event
const zapLoader = createZapsLoader(pool, { eventStore });

// The author whose notes we want to display
const AUTHOR = normalizeToPubkey("npub1dergggklka99wwrs92yz8wdjs952h2ux2ha2ed598ngwu9w7a6fsh9xzpc")!;

/** A component for rendering user avatars */
function Avatar({ user, size = "w-10" }: { user: User; size?: string }) {
  const profile = use$(user.profile$);
  return (
    <div className="avatar">
      <div className={`${size} rounded-full`}>
        <img src={profile?.picture || `https://robohash.org/${user.pubkey}.png`} alt="" />
      </div>
    </div>
  );
}

/** A component for rendering usernames */
function Username({ user }: { user: User }) {
  const profile = use$(user.profile$);
  return <>{profile?.displayName || profile?.name || user.pubkey.slice(0, 8) + "..."}</>;
}

/** A single zap entry in the per-note zap list */
function ZapItem({ zap }: { zap: Zap }) {
  const sats = Math.round(zap.amount / 1000);
  // The zap message is the content of the zap request event inside the receipt
  const message = zap.request.content;

  return (
    <div className="flex flex-col gap-1 text-sm">
      <div className="flex items-center gap-2">
        <Avatar user={zap.sender} size="w-6" />
        <span className="font-medium truncate">
          <Username user={zap.sender} />
        </span>
        {message && <p className="ms-8 text-gray-600 whitespace-pre-wrap wrap-break-word">{message}</p>}
        <span className="ms-auto text-warning font-bold whitespace-nowrap">⚡ {sats.toLocaleString()} sats</span>
      </div>
    </div>
  );
}

/** A note card that triggers the zap loader and renders any zaps it gets back */
function NoteCard({ note }: { note: Note }) {
  // Subscribe to zaps for this note via the Note cast (backed by EventZapsModel)
  const zaps = use$(note.zaps$);

  // Trigger the zaps loader for this note's event
  use$(() => zapLoader(note.event), [note.id]);

  const totalSats = useMemo(() => (zaps ? zaps.reduce((sum, z) => sum + Math.round(z.amount / 1000), 0) : 0), [zaps]);

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <div className="flex items-center gap-4">
          <Avatar user={note.author} />
          <div className="flex flex-col">
            <h2 className="card-title">
              <Username user={note.author} />
            </h2>
            <time className="text-sm text-gray-500">{note.createdAt.toLocaleString()}</time>
          </div>
        </div>

        <p className="mt-2 whitespace-pre-wrap">{note.event.content}</p>

        <div className="mt-2 pt-2 border-t border-base-300/50">
          {zaps && zaps.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm">
                  ⚡ {zaps.length} zap{zaps.length !== 1 ? "s" : ""} · {totalSats.toLocaleString()} sats
                </span>
              </div>
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {zaps.map((zap) => (
                  <ZapItem key={zap.id} zap={zap} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500">No zaps yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoadingZaps() {
  const [pubkey, setPubkey] = useState(AUTHOR);

  // Cast the pubkey into a User instance
  const author = useMemo(() => castUser(pubkey, eventStore), [pubkey]);

  // Subscribe to the author's outboxes
  const relays = use$(author.outboxes$);
  const filter = useMemo(() => ({ kinds: [1], authors: [author.pubkey] }), [author.pubkey]);

  // Paginated timeline loader for the author's kind 1 notes
  const timeline = useMemo(() => {
    if (!relays) return null;

    return createTimelineLoader(pool, relays, filter, { eventStore, limit: 50 });
  }, [filter, relays?.join("|")]);

  // Load the first page on mount / relay change
  useEffect(() => {
    if (!timeline) return;
    console.log("loading timeline");
    const sub = timeline().subscribe();
    return () => sub.unsubscribe();
  }, [timeline]);

  // Subscribe to the timeline from the event store and cast each event to a Note
  const notes = use$(() => eventStore.timeline(filter).pipe(castTimelineStream(Note)), [filter]);

  return (
    <div className="container mx-auto my-8 px-4 max-w-3xl">
      <PubkeyPicker value={pubkey} onChange={setPubkey} />

      <div className="flex flex-col gap-4 py-4">
        {notes?.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
        <button className="btn btn-primary mx-auto" onClick={() => timeline && timeline().subscribe()}>
          Load More
        </button>
      </div>
    </div>
  );
}
