/**
 * Public feed of users' favorite Git repositories from NIP-51 lists
 * @tags nip-51, nip-34, git, repositories, feed
 * @related casting/custom, bookmarks/manager
 */
import { FavoriteGitRepos, GitRepository } from "applesauce-common/casts";
import { FAVORITE_GIT_REPOS_KIND } from "applesauce-common/helpers";
import { castEventStream, castTimelineStream } from "applesauce-common/observable";
import { catchErrorInline, EventStore, mapEventsToStore } from "applesauce-core";
import {
  AddressPointer,
  getDisplayName,
  getProfilePicture,
  getReplaceableAddressFromPointer,
} from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { useState } from "react";
import { map } from "rxjs";
import RelayPicker from "../../components/relay-picker";

type RepositoryFavorite = {
  pointer: AddressPointer;
  address: string;
  favoritedBy: FavoriteGitRepos[];
};

const eventStore = new EventStore();
const pool = new RelayPool();

createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com/"],
  extraRelays: ["wss://relay.damus.io/", "wss://nos.lol/", "wss://relay.primal.net/", "wss://relay.nostr.band/"],
});

function Favoriter({ list }: { list: FavoriteGitRepos }) {
  const pubkey = list.event.pubkey;
  const profile = use$(list.author.profile$);
  const displayName = profile?.displayName || profile?.name || pubkey.slice(0, 8) + "...";
  const picture = profile?.picture || `https://robohash.org/${pubkey}.png`;
  return (
    <div className="tooltip flex-none" data-tip={displayName}>
      <div className="avatar">
        <div className="w-8 h-8 rounded-full border border-base-300">
          <img src={picture} alt={displayName} />
        </div>
      </div>
    </div>
  );
}

function RepositoryRow({ favorite }: { favorite: RepositoryFavorite }) {
  const repo = use$(
    () => eventStore.replaceable(favorite.pointer).pipe(castEventStream(GitRepository, eventStore)),
    [favorite.address],
  );
  const ownerProfile = use$(() => eventStore.profile(favorite.pointer.pubkey), [favorite.pointer.pubkey]);
  const ownerName = getDisplayName(ownerProfile, favorite.pointer.pubkey.slice(0, 8) + "...");
  const ownerPicture = getProfilePicture(ownerProfile, `https://robohash.org/${favorite.pointer.pubkey}.png`);

  if (!repo) {
    return (
      <div className="border border-base-300 bg-base-100 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="font-mono text-sm truncate">{favorite.address}</div>
            <div className="text-sm text-base-content/60">Loading repository announcement...</div>
          </div>
          <span className="loading loading-spinner loading-sm" />
        </div>
      </div>
    );
  }

  return (
    <article className="border border-base-300 bg-base-100 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="avatar">
              <div className="w-9 h-9 rounded-full border border-base-300">
                <img src={ownerPicture} alt={ownerName} />
              </div>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold leading-tight truncate">{repo.name ?? favorite.pointer.identifier}</h2>
              <p className="text-xs text-base-content/60 truncate">
                {ownerName} / <code>{favorite.pointer.identifier}</code>
              </p>
            </div>
          </div>

          {repo.description && <p className="text-sm text-base-content/80 mb-3 max-w-3xl">{repo.description}</p>}

          {repo.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {repo.hashtags.slice(0, 8).map((tag) => (
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
                <button className="btn btn-xs" onClick={() => navigator.clipboard.writeText(repo.cloneUrls[0] ?? "")}>
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
        </div>

        <div className="md:w-56 md:border-l md:border-base-300 md:pl-4">
          <div className="text-xs uppercase tracking-wide text-base-content/60 mb-2">
            Favorited by {favorite.favoritedBy.length}
          </div>
          <div className="flex flex-wrap gap-0.5 mb-3 overflow-hidden">
            {favorite.favoritedBy.slice(0, 10).map((list) => (
              <Favoriter key={list.event.id} list={list} />
            ))}
          </div>
          <div className="text-xs text-base-content/60">
            Latest list:{" "}
            {new Date(Math.max(...favorite.favoritedBy.map((list) => list.event.created_at)) * 1000).toLocaleString()}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function FavoriteRepositoriesFeed() {
  const [relay, setRelay] = useState("wss://relay.ngit.dev/");

  use$(
    () =>
      pool
        .relay(relay)
        .subscription({ kinds: [FAVORITE_GIT_REPOS_KIND], limit: 100 })
        .pipe(mapEventsToStore(eventStore), catchErrorInline()),
    [relay],
  );

  const favorites = use$(
    () =>
      eventStore.timeline({ kinds: [FAVORITE_GIT_REPOS_KIND] }).pipe(
        castTimelineStream(FavoriteGitRepos, eventStore),
        map((lists) => {
          const favoritesByAddress = new Map<string, RepositoryFavorite>();

          for (const list of lists) {
            for (const pointer of list.repositoryPointers) {
              const address = getReplaceableAddressFromPointer(pointer);
              const favorite = favoritesByAddress.get(address);

              if (favorite) favorite.favoritedBy.push(list);
              else favoritesByAddress.set(address, { pointer, address, favoritedBy: [list] });
            }
          }

          return [...favoritesByAddress.values()].sort((a, b) => b.favoritedBy.length - a.favoritedBy.length);
        }),
      ),
    [],
  );

  const favoriteRows = favorites ?? [];
  const listsCount = new Set(favoriteRows.flatMap((favorite) => favorite.favoritedBy.map((list) => list.event.id)))
    .size;
  const publicPointers = favoriteRows.reduce((sum, favorite) => sum + favorite.favoritedBy.length, 0);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="mb-5 flex gap-4 justify-between items-center">
        <RelayPicker value={relay} onChange={setRelay} common={["wss://relay.ngit.dev/", "wss://gitnostr.com/"]} />

        <div className="stats stats-vertical sm:stats-horizontal border border-base-300 mt-5">
          <div className="stat py-3">
            <div className="stat-title">Lists</div>
            <div className="stat-value text-2xl">{listsCount}</div>
          </div>
          <div className="stat py-3">
            <div className="stat-title">Public Pointers</div>
            <div className="stat-value text-2xl">{publicPointers}</div>
          </div>
          <div className="stat py-3">
            <div className="stat-title">Repositories</div>
            <div className="stat-value text-2xl">{favoriteRows.length}</div>
          </div>
        </div>
      </div>

      {!favorites ? (
        <div className="border border-base-300 p-6 text-center">
          <span className="loading loading-spinner" />
          <p className="mt-3 text-base-content/70">Listening for public Git repository lists...</p>
        </div>
      ) : favoriteRows.length === 0 ? (
        <div className="border border-base-300 p-6 text-center">
          <h2 className="font-semibold">No public Git repository favorites found yet</h2>
          <p className="text-sm text-base-content/70 mt-2">
            Try another relay, or wait for kind {FAVORITE_GIT_REPOS_KIND} events to arrive.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {favoriteRows.map((favorite) => (
            <RepositoryRow key={favorite.address} favorite={favorite} />
          ))}
        </div>
      )}
    </div>
  );
}
