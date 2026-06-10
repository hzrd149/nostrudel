/**
 * Search NIP-34 repository announcements via NIP-50 on ngit index relay
 * @tags nip-34, nip-50, git, search, reactions, feed
 * @related git/favorite-repos-feed, feed/loading-reactions, search/relay
 */
import { GitRepository, User } from "applesauce-common/casts";
import { GIT_REPOSITORY_KIND } from "applesauce-common/helpers";
import { ReactionsModel } from "applesauce-common/models";
import { EventStore, mapEventsToStore } from "applesauce-core";
import { castEvent } from "applesauce-core/casts";
import {
  type Filter,
  ensureWebSocketURL,
  getDisplayName,
  getProfilePicture,
  getReplaceableAddress,
  naddrEncode,
  normalizeURL,
  npubEncode,
  relaySet,
} from "applesauce-core/helpers";
import { processTags } from "applesauce-core/helpers/tags";
import { NostrEvent } from "applesauce-core/helpers/event";
import { mapEventsToTimeline } from "applesauce-core/observable";
import { createEventLoaderForStore, createReactionsLoader } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { useCallback, useEffect, useMemo, useState } from "react";
import { combineLatest, lastValueFrom, map, of } from "rxjs";

import RelayPicker from "../../components/relay-picker";

const DEFAULT_INDEX_RELAY = "wss://index.ngit.dev/";

const eventStore = new EventStore();
const pool = new RelayPool();

createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com/"],
  extraRelays: ["wss://relay.damus.io/", "wss://nos.lol/", "wss://relay.primal.net/", "wss://relay.ngit.dev/"],
});

const reactionLoader = createReactionsLoader(pool, { eventStore });

function graspServersFromRepoTags(event: NostrEvent): string[] {
  return relaySet(processTags(event.tags, (tag) => (tag[0] === "g" ? tag[1] : undefined)));
}

function endpointHostname(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** URL suitable for {@link RelayPool.relay} (NIP-11 + shared connection). */
function toPoolRelayUrl(rawUrl: string): string | null {
  try {
    let u = rawUrl.trim();
    if (u.startsWith("http:") || u.startsWith("https:")) u = ensureWebSocketURL(u);
    return normalizeURL(u);
  } catch {
    return null;
  }
}

function MaintainerChip({ user }: { user: User }) {
  const profile = use$(() => user.profile$, [user.pubkey]);
  const displayName = getDisplayName(profile, user.pubkey.slice(0, 8) + "…");
  const picture = getProfilePicture(profile, `https://robohash.org/${user.pubkey}.png`);

  return (
    <div className="flex items-center gap-2 min-w-0 max-w-[14rem] rounded border border-base-300 bg-base-200/40 px-2 py-1">
      <div className="avatar shrink-0">
        <div className="w-5 h-5 rounded-full border border-base-300">
          <img src={picture} alt="" />
        </div>
      </div>
      <span className="truncate text-xs font-medium text-base-content/90">{displayName}</span>
    </div>
  );
}

function EndpointChip({ pool, url, kind }: { pool: RelayPool; url: string; kind: "relay" | "grasp" }) {
  const kindLabel = kind === "relay" ? "Relay" : "Grasp";

  const display = use$(() => {
    const relayUrl = toPoolRelayUrl(url);
    if (!relayUrl) {
      return of({ icon: undefined as string | undefined, name: url });
    }
    const r = pool.relay(relayUrl);
    return combineLatest([r.icon$, r.information$]).pipe(
      map(([icon, info]) => ({
        icon,
        name: (info?.name && info.name.trim()) || endpointHostname(url) || relayUrl,
      })),
    );
  }, [pool, url]);

  return (
    <span
      className="inline-flex items-center gap-1.5 max-w-[14rem] rounded border border-base-300 bg-base-200/40 px-2 py-0.5 text-xs"
      title={`${kindLabel}: ${url}`}
    >
      {display?.icon ? (
        <img
          src={display.icon}
          alt=""
          className="size-3.5 shrink-0 rounded-sm"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).hidden = true;
          }}
        />
      ) : null}
      <span className="truncate font-medium text-base-content/90">{display?.name ?? endpointHostname(url)}</span>
    </span>
  );
}

function dedupeLatestRepoVersions(events: NostrEvent[]): NostrEvent[] {
  const best = new Map<string, NostrEvent>();
  for (const e of events) {
    const addr = getReplaceableAddress(e);
    if (!addr) continue;
    const cur = best.get(addr);
    if (!cur || e.created_at > cur.created_at) best.set(addr, e);
  }
  return Array.from(best.values()).sort((a, b) => b.created_at - a.created_at);
}

function useReactions(event: NostrEvent, relayHints: string[]) {
  const reactions = use$(
    () =>
      eventStore.model(ReactionsModel, event).pipe(
        map((list) =>
          list.reduce(
            (acc, reaction) => {
              const content = reaction.content || "+";
              acc[content] = (acc[content] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          ),
        ),
      ),
    [event],
  );

  const hintsKey = relayHints.join("|");
  use$(() => reactionLoader(event, relayHints), [event, hintsKey]);

  return reactions ?? {};
}

function ReactionSection({ event, relayHints }: { event: NostrEvent; relayHints: string[] }) {
  const reactions = useReactions(event, relayHints);
  const entries = Object.entries(reactions);

  if (entries.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="text-xs uppercase tracking-wide text-base-content/60 mb-1">Reactions (kind 7)</div>
      <div className="flex flex-wrap gap-2 mt-2">
        {entries.map(([emoji, count]) => (
          <div key={emoji} className="badge badge-outline badge-sm flex items-center gap-1">
            <span>{emoji}</span>
            <span>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RepoCard({ pool, event, relayHints }: { pool: RelayPool; event: NostrEvent; relayHints: string[] }) {
  const repo = useMemo(() => castEvent(event, GitRepository, eventStore), [event]);

  const profile = use$(() => eventStore.profile(event.pubkey), [event.pubkey]);
  const ownerName = getDisplayName(profile, event.pubkey.slice(0, 8) + "...");
  const ownerPicture = getProfilePicture(profile, `https://robohash.org/${event.pubkey}.png`);

  const upstream = use$(repo.upstream$);
  const graspServers = useMemo(() => graspServersFromRepoTags(event), [event]);
  const hasRelays = repo.relays.length > 0;
  const hasGrasp = graspServers.length > 0;

  const upstreamPubkey = upstream?.author.pubkey;
  const upstreamProfile = use$(
    () => (upstreamPubkey ? eventStore.profile(upstreamPubkey) : undefined),
    [upstreamPubkey ?? ""],
  );

  const npub = useMemo(() => npubEncode(event.pubkey), [event.pubkey]);
  const gitworkshopUrl = useMemo(
    () => `https://gitworkshop.dev/${npub}/${encodeURIComponent(repo.identifier)}`,
    [npub, repo.identifier],
  );
  const nostrNaddrUri = `nostr:${naddrEncode(repo.pointer)}`;

  const upstreamWorkshopUrl = upstream
    ? `https://gitworkshop.dev/${npubEncode(upstream.author.pubkey)}/${encodeURIComponent(upstream.identifier)}`
    : "";
  const upstreamNostrNaddrUri = upstream ? `nostr:${naddrEncode(upstream.pointer)}` : "";

  const [naddrCopied, setNaddrCopied] = useState(false);
  const [upstreamNaddrCopied, setUpstreamNaddrCopied] = useState(false);
  const copyNaddr = async () => {
    try {
      await navigator.clipboard.writeText(nostrNaddrUri);
      setNaddrCopied(true);
      setTimeout(() => setNaddrCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };
  const copyUpstreamNaddr = async () => {
    if (!upstreamNostrNaddrUri) return;
    try {
      await navigator.clipboard.writeText(upstreamNostrNaddrUri);
      setUpstreamNaddrCopied(true);
      setTimeout(() => setUpstreamNaddrCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <article className="border border-base-300 bg-base-100 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex-1 min-w-0">
          <div className="flex gap-4 justify-between items-start flex-wrap">
            <div className="flex items-center gap-3 mb-2">
              <div className="avatar">
                <div className="w-9 h-9 rounded-full border border-base-300">
                  <img src={ownerPicture} alt={ownerName} />
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold leading-tight truncate">{repo.name ?? repo.identifier}</h2>
                <p className="text-xs text-base-content/60 truncate">
                  {ownerName} / <code>{repo.identifier}</code>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <a href={gitworkshopUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                Open Git Workshop
              </a>
              <button type="button" className="btn btn-sm" onClick={() => void copyNaddr()} title={nostrNaddrUri}>
                {naddrCopied ? "Copied" : "Copy naddr"}
              </button>
            </div>
          </div>

          {upstream && upstreamPubkey && (
            <div className="mb-3 border border-base-300 bg-base-200/30 px-3 py-3">
              <div className="text-xs uppercase tracking-wide text-base-content/60 mb-2">Upstream repository</div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="avatar shrink-0">
                    <div className="w-9 h-9 rounded-full border border-base-300">
                      <img
                        src={getProfilePicture(upstreamProfile, `https://robohash.org/${upstreamPubkey}.png`)}
                        alt=""
                      />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {getDisplayName(upstreamProfile, upstreamPubkey.slice(0, 8) + "…")} /{" "}
                      <code className="text-xs">{upstream.identifier}</code>
                    </div>
                    <p className="text-xs text-base-content/60 mt-0.5">
                      This repo references the above as its upstream.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <a
                    href={upstreamWorkshopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline"
                  >
                    Open Git Workshop
                  </a>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => void copyUpstreamNaddr()}
                    title={upstreamNostrNaddrUri}
                  >
                    {upstreamNaddrCopied ? "Copied" : "Copy naddr"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {repo.description && <p className="text-sm text-base-content/80 mb-3 max-w-3xl">{repo.description}</p>}

          <div className="text-xs text-base-content/60 mb-2 space-y-1">
            <div>
              Updated{" "}
              <time dateTime={new Date(event.created_at * 1000).toISOString()}>{repo.createdAt.toLocaleString()}</time>
            </div>
            {repo.earliestUniqueCommit && (
              <div>
                <span className="font-medium text-base-content/80">Earliest unique commit</span>{" "}
                <code className="bg-base-200 px-1">{repo.earliestUniqueCommit}</code>
              </div>
            )}
          </div>

          {repo.maintainers.length > 0 && (
            <div className="mb-3">
              <div className="text-xs uppercase tracking-wide text-base-content/60 mb-1">Maintainers</div>
              <div className="flex flex-wrap gap-2">
                {repo.maintainers.slice(0, 12).map((maintainer) => (
                  <MaintainerChip key={maintainer.pubkey} user={maintainer} />
                ))}
              </div>
            </div>
          )}

          {(hasRelays || hasGrasp) && (
            <div className="mb-3">
              <div className="text-xs uppercase tracking-wide text-base-content/60 mb-1">
                {hasRelays && hasGrasp ? "Relays & Grasp" : hasRelays ? "Relays" : "Grasp servers"}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {repo.relays.map((r) => (
                  <EndpointChip key={r} pool={pool} url={r} kind="relay" />
                ))}
                {graspServers.map((g) => (
                  <EndpointChip key={g} pool={pool} url={g} kind="grasp" />
                ))}
              </div>
            </div>
          )}

          {repo.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {repo.hashtags.slice(0, 12).map((tag) => (
                <span key={tag} className="badge badge-outline badge-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 text-sm">
            {repo.cloneUrls[0] && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base-content/60">Clone</span>
                <code className="bg-base-200 px-2 py-1 text-xs break-all">{repo.cloneUrls[0]}</code>
                <button
                  type="button"
                  className="btn btn-xs"
                  onClick={() => navigator.clipboard.writeText(repo.cloneUrls[0] ?? "")}
                >
                  Copy
                </button>
              </div>
            )}

            {repo.webUrls[0] && (
              <a href={repo.webUrls[0]} target="_blank" rel="noopener noreferrer" className="link link-primary w-fit">
                Open repository website
              </a>
            )}
          </div>

          <ReactionSection event={event} relayHints={relayHints} />
        </div>
      </div>
    </article>
  );
}

export default function RepoSearchFeed() {
  const [relay, setRelay] = useState(DEFAULT_INDEX_RELAY);
  const [draftQuery, setDraftQuery] = useState("");
  const [repos, setRepos] = useState<NostrEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const relayHints = useMemo(() => [relay, "wss://relay.ngit.dev/", "wss://relay.damus.io/"].filter(Boolean), [relay]);

  const load = useCallback(
    async (search: string) => {
      setLoading(true);
      setError(null);

      const filter: Filter = {
        kinds: [GIT_REPOSITORY_KIND],
        limit: 50,
      };
      const q = search.trim();
      if (q) filter.search = q;

      try {
        const timeline = await lastValueFrom(
          pool
            .relay(relay)
            .request(filter, { timeout: 20_000 })
            .pipe(mapEventsToStore(eventStore), mapEventsToTimeline()),
        );
        setRepos(dedupeLatestRepoVersions(timeline));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed");
        setRepos([]);
      } finally {
        setLoading(false);
      }
    },
    [relay],
  );

  useEffect(() => {
    void load("");
  }, [load]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <label className="label" htmlFor="repo-search-q">
            <span className="label-text">Search repositories (NIP-50)</span>
          </label>
          <div className="join flex">
            <input
              id="repo-search-q"
              type="search"
              className="input input-bordered join-item flex-1"
              placeholder="Filter indexed repos…"
              value={draftQuery}
              onChange={(e) => setDraftQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load(draftQuery)}
            />
            <button
              type="button"
              className="btn btn-primary join-item"
              disabled={loading}
              onClick={() => void load(draftQuery)}
            >
              {loading ? <span className="loading loading-spinner loading-sm" /> : null}
              Search
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <RelayPicker
            value={relay}
            onChange={setRelay}
            common={[DEFAULT_INDEX_RELAY, "wss://relay.ngit.dev/", "wss://search.nos.today"]}
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-warning mb-4" role="alert">
          {error}
        </div>
      )}

      {loading && repos === null ? (
        <div className="border border-base-300 p-6 text-center">
          <span className="loading loading-spinner" />
          <p className="mt-3 text-base-content/70">Loading repository announcements…</p>
        </div>
      ) : !repos || repos.length === 0 ? (
        <div className="border border-base-300 p-6 text-center">
          <h2 className="font-semibold">No repositories found</h2>
          <p className="text-sm text-base-content/70 mt-2">Try another query or relay.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {repos.map((ev) => (
            <RepoCard key={getReplaceableAddress(ev) ?? ev.id} pool={pool} event={ev} relayHints={relayHints} />
          ))}
        </div>
      )}
    </div>
  );
}
