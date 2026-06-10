/**
 * Display torrent files shared on Nostr with metadata and download information
 * @tags nip-35, torrent, feed, files
 * @related feed/relay-timeline
 */
import { Reaction, Torrent, Zap } from "applesauce-common/casts";
import { TORRENT_KIND } from "applesauce-common/helpers";
import { castTimelineStream } from "applesauce-common/observable";
import { remarkNostrMentions } from "applesauce-content/markdown";
import { EventStore, mapEventsToStore } from "applesauce-core";
import { Filter, persistEventsToCache } from "applesauce-core/helpers";
import { createEventLoaderForStore, createReactionsLoader, createZapsLoader } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { addEvents, getEventsForFilters, openDB } from "nostr-idb";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BehaviorSubject } from "rxjs";
import RelayPicker from "../../components/relay-picker";

// Setup event store
const eventStore = new EventStore();

// Memoize plugins and components at module level
const remarkPlugins = [remarkGfm, remarkNostrMentions];
const markdownComponents = {
  h1: ({ ...props }: any) => <h1 className="text-3xl font-bold my-4" {...props} />,
  h2: ({ ...props }: any) => <h2 className="text-2xl font-bold my-3" {...props} />,
  h3: ({ ...props }: any) => <h3 className="text-xl font-bold my-2" {...props} />,
  p: ({ ...props }: any) => <p className="my-2" {...props} />,
  a: ({ ...props }: any) => <a className="link link-primary" target="_blank" {...props} />,
  ul: ({ ...props }: any) => <ul className="list-disc ml-4 my-2" {...props} />,
  ol: ({ ...props }: any) => <ol className="list-decimal ml-4 my-2" {...props} />,
  blockquote: ({ ...props }: any) => <blockquote className="border-l-4 border-primary pl-4 my-2" {...props} />,
  code: ({ ...props }: any) => <code className="bg-base-300 rounded px-1" {...props} />,
  pre: ({ ...props }: any) => <pre className="bg-base-300 rounded p-4 my-2 overflow-x-auto" {...props} />,
  table: ({ ...props }: any) => (
    <div className="overflow-x-auto my-4">
      <table className="table table-zebra w-full" {...props} />
    </div>
  ),
  thead: ({ ...props }: any) => <thead className="bg-base-200" {...props} />,
  tbody: ({ ...props }: any) => <tbody {...props} />,
  tr: ({ ...props }: any) => <tr {...props} />,
  th: ({ ...props }: any) => <th {...props} />,
  td: ({ ...props }: any) => <td {...props} />,
};

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
createEventLoaderForStore(eventStore, pool, {
  cacheRequest,
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com/"],
});

const zapLoader = createZapsLoader(pool, { eventStore });
const reactionLoader = createReactionsLoader(pool, { eventStore });

// BehaviorSubject to store the selected torrent
const selectedTorrent$ = new BehaviorSubject<Torrent | null>(null);

/** Component to render a single reaction */
function ReactionItem({ reaction }: { reaction: Reaction }) {
  const profile = use$(reaction.author.profile$);
  const displayName = profile?.displayName || reaction.author.npub;
  const picture = profile?.picture || `https://robohash.org/${reaction.author.pubkey}.png`;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="avatar">
        <div className="w-6 rounded-full">
          <img src={picture} alt={displayName} />
        </div>
      </div>
      <span className="font-medium">{displayName}</span>
      <span className="text-base-content/60">{reaction.content || "+"}</span>
    </div>
  );
}

/** Component to render a single zap */
function ZapItem({ zap }: { zap: Zap }) {
  const profile = use$(zap.sender.profile$);
  const displayName = profile?.displayName || zap.sender.npub;
  const picture = profile?.picture || `https://robohash.org/${zap.sender.pubkey}.png`;
  const amountSats = Math.round(zap.amount / 1000); // Convert msats to sats

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="avatar">
        <div className="w-6 rounded-full">
          <img src={picture} alt={displayName} />
        </div>
      </div>
      <span className="font-medium">{displayName}</span>
      <span className="text-primary">⚡ {amountSats} sats</span>
    </div>
  );
}

/** Component to render a single torrent with reactions and zaps */
function TorrentItem({ torrent }: { torrent: Torrent }) {
  const profile = use$(torrent.author.profile$);
  const reactions = use$(torrent.reactions$);
  const zaps = use$(torrent.zaps$);

  const displayName = profile?.displayName || torrent.author.npub;
  const picture = profile?.picture || `https://robohash.org/${torrent.author.pubkey}.png`;

  // load zaps and reactions
  use$(() => zapLoader(torrent.event), [torrent.id]);
  use$(() => reactionLoader(torrent.event), [torrent.id]);

  // Group reactions by emoji
  const reactionGroups = reactions?.reduce(
    (acc, reaction) => {
      const emoji = reaction.content || "+";
      if (!acc[emoji]) {
        acc[emoji] = [];
      }
      acc[emoji].push(reaction);
      return acc;
    },
    {} as Record<string, Reaction[]>,
  );

  const totalZapAmount = zaps?.reduce((sum, zap) => sum + zap.amount, 0) || 0;
  const totalZapSats = Math.round(totalZapAmount / 1000);

  return (
    <div
      className="card bg-base-100 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => selectedTorrent$.next(torrent)}
    >
      <div className="card-body">
        <div className="flex items-center gap-3 mb-2">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src={picture} alt={displayName} />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{displayName}</h3>
            <p className="text-sm text-base-content/60">{torrent.author.npub}</p>
          </div>
          <time className="text-sm text-base-content/60">{torrent.createdAt.toLocaleString()}</time>
        </div>

        {/* Torrent Info */}
        <div className="mb-3">
          <h4 className="font-bold text-lg mb-2">{torrent.title || "Untitled Torrent"}</h4>
          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium">Info Hash: </span>
              <code className="text-xs bg-base-200 px-1 py-0.5 rounded">{torrent.infoHash}</code>
            </div>
            {torrent.category && (
              <div>
                <span className="font-medium">Category: </span>
                <span>{torrent.category}</span>
              </div>
            )}
            {torrent.categoryPath && (
              <div>
                <span className="font-medium">Category Path: </span>
                <span>{torrent.categoryPath}</span>
              </div>
            )}
            {torrent.files && torrent.files.length > 0 && (
              <div>
                <span className="font-medium">Files: </span>
                <span>{torrent.files.length}</span>
              </div>
            )}
            {torrent.trackers && torrent.trackers.length > 0 && (
              <div>
                <span className="font-medium">Trackers: </span>
                <span>{torrent.trackers.length}</span>
              </div>
            )}
            {torrent.magnetLink && (
              <div>
                <a
                  href={torrent.magnetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  Open Magnet Link
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Reactions */}
        {reactionGroups && Object.keys(reactionGroups).length > 0 && (
          <div className="mt-2 pt-2 border-t border-base-300/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">👍</span>
              <span className="font-semibold">
                {reactions?.length || 0} reaction{reactions?.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(reactionGroups).map(([emoji, reactionList]) => (
                <div key={emoji} className="flex flex-col gap-1">
                  <div className="badge badge-outline">
                    {emoji} {reactionList.length}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {reactionList.slice(0, 5).map((reaction) => (
                      <ReactionItem key={reaction.uid} reaction={reaction} />
                    ))}
                    {reactionList.length > 5 && (
                      <span className="text-xs text-base-content/60">+{reactionList.length - 5} more</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Zaps */}
        {zaps && zaps.length > 0 && (
          <div className="mt-2 pt-2 border-t border-base-300/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚡</span>
              <span className="font-semibold">
                {zaps.length} zap{zaps.length !== 1 ? "s" : ""} • {totalZapSats} sats total
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {zaps.map((zap) => (
                <ZapItem key={zap.uid} zap={zap} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Component for the full torrent view */
function TorrentView({ torrent, onBack }: { torrent: Torrent; onBack: () => void }) {
  const profile = use$(torrent.author.profile$);
  const reactions = use$(torrent.reactions$);
  const zaps = use$(torrent.zaps$);

  const displayName = profile?.displayName || torrent.author.npub;
  const picture = profile?.picture || `https://robohash.org/${torrent.author.pubkey}.png`;

  // Group reactions by emoji
  const reactionGroups = reactions?.reduce(
    (acc, reaction) => {
      const emoji = reaction.content || "+";
      if (!acc[emoji]) {
        acc[emoji] = [];
      }
      acc[emoji].push(reaction);
      return acc;
    },
    {} as Record<string, Reaction[]>,
  );

  const totalZapAmount = zaps?.reduce((sum, zap) => sum + zap.amount, 0) || 0;
  const totalZapSats = Math.round(totalZapAmount / 1000);

  return (
    <div className="container mx-auto my-8 max-w-6xl px-4 w-full">
      <div className="py-4">
        <button className="btn btn-ghost gap-2 mb-4" onClick={onBack}>
          Back to Feed
        </button>

        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-4">
              <div className="avatar">
                <div className="w-12 rounded-full">
                  <img src={picture} alt={displayName} />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{displayName}</h3>
                <p className="text-sm text-base-content/60">{torrent.author.npub}</p>
              </div>
              <time className="text-sm text-base-content/60">{torrent.createdAt.toLocaleString()}</time>
            </div>

            <h1 className="text-4xl font-bold mb-4">{torrent.title || "Untitled Torrent"}</h1>

            {/* Torrent Info */}
            <div className="mb-6 p-4 bg-base-200 rounded-lg">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Info Hash: </span>
                  <code className="text-xs bg-base-300 px-2 py-1 rounded">{torrent.infoHash}</code>
                </div>
                {torrent.category && (
                  <div>
                    <span className="font-medium">Category: </span>
                    <span>{torrent.category}</span>
                  </div>
                )}
                {torrent.categoryPath && (
                  <div>
                    <span className="font-medium">Category Path: </span>
                    <span>{torrent.categoryPath}</span>
                  </div>
                )}
                {torrent.files && torrent.files.length > 0 && (
                  <div>
                    <span className="font-medium">Files: </span>
                    <span>{torrent.files.length}</span>
                    <ul className="list-disc list-inside mt-1 ml-4">
                      {torrent.files.slice(0, 10).map((file, idx) => (
                        <li key={idx} className="text-xs">
                          {file.name} ({file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "unknown size"})
                        </li>
                      ))}
                      {torrent.files.length > 10 && (
                        <li className="text-xs">... and {torrent.files.length - 10} more</li>
                      )}
                    </ul>
                  </div>
                )}
                {torrent.trackers && torrent.trackers.length > 0 && (
                  <div>
                    <span className="font-medium">Trackers: </span>
                    <span>{torrent.trackers.length}</span>
                    <ul className="list-disc list-inside mt-1 ml-4">
                      {torrent.trackers.slice(0, 5).map((tracker, idx) => (
                        <li key={idx} className="text-xs">
                          {tracker}
                        </li>
                      ))}
                      {torrent.trackers.length > 5 && (
                        <li className="text-xs">... and {torrent.trackers.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
                {torrent.magnetLink && (
                  <div className="mt-3">
                    <a
                      href={torrent.magnetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      Open Magnet Link
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Markdown Content */}
            {torrent.event.content && (
              <div className="prose prose-lg max-w-none mb-6">
                <ReactMarkdown remarkPlugins={remarkPlugins} components={markdownComponents}>
                  {torrent.event.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Reactions */}
            {reactionGroups && Object.keys(reactionGroups).length > 0 && (
              <div className="mt-6 pt-6 border-t border-base-300/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">👍</span>
                  <span className="font-semibold">
                    {reactions?.length || 0} reaction{reactions?.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(reactionGroups).map(([emoji, reactionList]) => (
                    <div key={emoji} className="flex flex-col gap-1">
                      <div className="badge badge-outline">
                        {emoji} {reactionList.length}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {reactionList.slice(0, 5).map((reaction) => (
                          <ReactionItem key={reaction.uid} reaction={reaction} />
                        ))}
                        {reactionList.length > 5 && (
                          <span className="text-xs text-base-content/60">+{reactionList.length - 5} more</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zaps */}
            {zaps && zaps.length > 0 && (
              <div className="mt-6 pt-6 border-t border-base-300/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">⚡</span>
                  <span className="font-semibold">
                    {zaps.length} zap{zaps.length !== 1 ? "s" : ""} • {totalZapSats} sats total
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {zaps.map((zap) => (
                    <ZapItem key={zap.uid} zap={zap} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TorrentFeed() {
  const [relay, setRelay] = useState<string>("wss://relay.primal.net/");
  const selectedTorrent = use$(selectedTorrent$);

  use$(
    () =>
      pool
        .relay(relay)
        .subscription({ kinds: [TORRENT_KIND], limit: 200 })
        .pipe(
          // Add all events to the store
          mapEventsToStore(eventStore),
        ),
    [relay],
  );

  const torrents = use$(
    () => eventStore.timeline({ kinds: [TORRENT_KIND] }).pipe(castTimelineStream(Torrent, eventStore)),
    [],
  );

  if (selectedTorrent) {
    return <TorrentView torrent={selectedTorrent} onBack={() => selectedTorrent$.next(null)} />;
  }

  return (
    <div className="max-w-6xl w-full mx-auto my-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Torrent Feed</h1>
        <p className="text-base-content/60 mb-4">
          A social feed of BitTorrent torrents (NIP-35) with reactions and zaps
        </p>
        <RelayPicker value={relay} onChange={setRelay} />
      </div>

      <div className="flex flex-col gap-4">
        {torrents === undefined ? (
          <div className="flex justify-center my-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : torrents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-base-content/60">No torrents found. Try a different relay.</p>
          </div>
        ) : (
          torrents.map((torrent) => <TorrentItem key={torrent.id} torrent={torrent} />)
        )}
      </div>
    </div>
  );
}
