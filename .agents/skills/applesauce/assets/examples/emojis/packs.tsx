/**
 * Browse emoji packs published on a relay and inspect every emoji in a selected pack
 * @tags nip-30, nip-51, emojis, feed, relay
 * @related notes/rendering
 */
import { EmojiPack } from "applesauce-common/casts";
import { EMOJI_PACK_KIND } from "applesauce-common/helpers";
import { castTimelineStream } from "applesauce-common/observable";
import { EventStore, mapEventsToStore, mapEventsToTimeline } from "applesauce-core";
import { getDisplayName, getProfilePicture } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { useEffect, useMemo, useState } from "react";
import RelayPicker from "../../components/relay-picker";

const eventStore = new EventStore();
const pool = new RelayPool();

createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

function EmojiPreviewRow({ pack }: { pack: EmojiPack }) {
  return (
    <div className="flex items-center gap-2 overflow-hidden">
      {pack.emojis.slice(0, 6).map((emoji) => (
        <div
          key={`${pack.id}-${emoji.shortcode}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-base-200"
        >
          <img
            src={emoji.url}
            alt={emoji.shortcode}
            title={`:${emoji.shortcode}:`}
            className="h-6 w-6 object-contain"
          />
        </div>
      ))}
      {pack.emojis.length > 6 && <span className="text-xs text-base-content/60">+{pack.emojis.length - 6}</span>}
    </div>
  );
}

function PackAuthor({ pack, compact = false }: { pack: EmojiPack; compact?: boolean }) {
  const profile = use$(pack.author.profile$);
  const displayName = getDisplayName(profile, pack.author.pubkey.slice(0, 8) + "...");
  const picture = getProfilePicture(profile, `https://robohash.org/${pack.author.pubkey}.png`);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <img src={picture} alt={displayName} className={compact ? "h-9 w-9 rounded-full" : "h-12 w-12 rounded-full"} />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{displayName}</div>
        <div className="truncate text-xs text-base-content/60">{pack.author.pubkey}</div>
        {!compact && profile?.about && (
          <div className="mt-1 line-clamp-2 text-sm text-base-content/70">{profile.about}</div>
        )}
      </div>
    </div>
  );
}

function PackFeedItem({ pack, selected, onSelect }: { pack: EmojiPack; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-full rounded-xl p-4 text-left transition-colors",
        selected ? "bg-primary/10" : "bg-base-100 hover:bg-base-200",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold">{pack.name || pack.identifier}</div>
          <div className="truncate text-xs text-base-content/60">{pack.identifier}</div>
        </div>
        <div className="shrink-0 rounded-full bg-base-200 px-2 py-1 text-xs text-base-content/70">
          {pack.emojis.length} emoji{pack.emojis.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="mt-3">
        <PackAuthor pack={pack} compact />
      </div>
      <div className="mt-3">
        <EmojiPreviewRow pack={pack} />
      </div>
    </button>
  );
}

function EmojiGrid({ pack }: { pack: EmojiPack }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
      {pack.emojis.map((emoji) => (
        <div key={`${pack.id}-${emoji.shortcode}`} className="rounded-xl bg-base-200 p-3">
          <div className="flex h-20 items-center justify-center rounded-lg bg-base-100">
            <img
              src={emoji.url}
              alt={emoji.shortcode}
              title={`:${emoji.shortcode}:`}
              className="h-12 w-12 object-contain"
            />
          </div>
          <div className="mt-3 truncate font-mono text-sm">:{emoji.shortcode}:</div>
          {emoji.address && <div className="mt-1 text-xs text-base-content/60">{emoji.address.identifier}</div>}
        </div>
      ))}
    </div>
  );
}

function PackDetail({ pack }: { pack: EmojiPack }) {
  return (
    <section className="flex-1 w-full h-full rounded-2xl bg-base-100 p-2 sm:p-5 overflow-y-auto overflow-x-hidden">
      <div className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold">{pack.name || pack.identifier}</h2>
          <div className="mt-1 truncate font-mono text-sm text-base-content/60">{pack.identifier}</div>
          {pack.description && <p className="mt-3 max-w-2xl text-sm text-base-content/80">{pack.description}</p>}
          <div className="mt-4">
            <PackAuthor pack={pack} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-sm text-base-content/70">
          <div className="rounded-full bg-base-200 px-3 py-1">{pack.emojis.length} total</div>
          <div className="rounded-full bg-base-200 px-3 py-1">{pack.createdAt.toLocaleDateString()}</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 text-sm font-medium text-base-content/70">All emojis in this pack</div>
        <EmojiGrid pack={pack} />
      </div>
    </section>
  );
}

export default function EmojiPacksExample() {
  const [relay, setRelay] = useState("wss://relay.ditto.pub");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const packs = use$(
    () =>
      relay
        ? pool
            .relay(relay)
            .subscription({ kinds: [EMOJI_PACK_KIND], limit: 200 })
            .pipe(mapEventsToStore(eventStore), mapEventsToTimeline(), castTimelineStream(EmojiPack, eventStore))
        : undefined,
    [relay],
  );

  const filteredPacks = useMemo(() => {
    if (!packs) return undefined;

    const normalized = query.trim().toLowerCase();
    const sorted = [...packs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (!normalized) return sorted;

    return sorted.filter((pack) => {
      const name = (pack.name || "").toLowerCase();
      const identifier = pack.identifier.toLowerCase();
      const author = pack.author.pubkey.toLowerCase();
      return name.includes(normalized) || identifier.includes(normalized) || author.includes(normalized);
    });
  }, [packs, query]);

  useEffect(() => {
    if (!filteredPacks || filteredPacks.length === 0) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !filteredPacks.some((pack) => pack.id === selectedId)) {
      setSelectedId(filteredPacks[0].id);
    }
  }, [filteredPacks, selectedId]);

  const selectedPack = filteredPacks?.find((pack) => pack.id === selectedId) ?? filteredPacks?.[0];

  return (
    <div className="flex w-full h-[calc(100vh-7rem)] flex-col gap-4 p-4 overflow-hidden">
      <RelayPicker value={relay} onChange={setRelay} />

      <div className="flex gap-2 flex-1 overflow-hidden">
        <section className="rounded-2xl bg-base-200/60 p-2 max-w-sm h-full overflow-y-auto overflow-x-hidden">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Pack Feed</h2>
            <div className="text-xs text-base-content/60">{filteredPacks?.length ?? 0} shown</div>
          </div>

          <div className="mt-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name, identifier, or author"
              className="input input-bordered w-full"
            />
          </div>

          <div className="mt-4 space-y-3">
            {!relay && (
              <div className="rounded-xl bg-base-100 p-4 text-sm text-base-content/60">
                Select a relay to load emoji packs.
              </div>
            )}

            {relay && filteredPacks === undefined && (
              <div className="rounded-xl bg-base-100 p-4 text-sm text-base-content/60">
                Loading packs from {relay}...
              </div>
            )}

            {relay && filteredPacks && filteredPacks.length === 0 && (
              <div className="rounded-xl bg-base-100 p-4 text-sm text-base-content/60">
                No emoji packs matched this relay and filter.
              </div>
            )}

            {filteredPacks?.map((pack) => (
              <PackFeedItem
                key={pack.uid}
                pack={pack}
                selected={pack.id === selectedPack?.id}
                onSelect={() => setSelectedId(pack.id)}
              />
            ))}
          </div>
        </section>

        {selectedPack ? (
          <PackDetail pack={selectedPack} />
        ) : (
          <section className="rounded-2xl bg-base-100 p-6 text-sm text-base-content/60">
            Pick a relay and select a pack to inspect its emojis.
          </section>
        )}
      </div>
    </div>
  );
}
