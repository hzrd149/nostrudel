import { mapEventsToStore } from "applesauce-core";
import { getOutboxes } from "applesauce-core/helpers";
import { SocialGraph } from "nostr-social-graph";
import { kinds } from "nostr-tools";
import { BehaviorSubject, combineLatest, exhaustMap, skip, Subscription, tap, throttleTime } from "rxjs";

import { SOCIAL_GRAPH_FALLBACK_PUBKEY } from "../const";
import { CAP_IS_WEB } from "../env";
import { logger } from "../helpers/debug";
import { formatBytes } from "../helpers/number";
import accounts from "./accounts";
import idbKeyValueStore from "./database/kv";
import { eventStore } from "./event-store";
import { socialGraphLoader } from "./loaders";
import localSettings from "./preferences";

const log = logger.extend("SocialGraph");

const cacheKey = "social-graph";

/** An observable that emits the social graph for the active account */
export const socialGraph$ = new BehaviorSubject<SocialGraph>(
  new SocialGraph(accounts.active?.pubkey ?? SOCIAL_GRAPH_FALLBACK_PUBKEY),
);

/** The current state of the social graph sync */
export const syncState$ = new BehaviorSubject<{ loaded: number } | null>(null);

/** The currently running sync subscription, or null when idle */
export const sync$ = new BehaviorSubject<Subscription | null>(null);

/** The current state of persisting the graph to local storage */
export const saveState$ = new BehaviorSubject<"idle" | "saving" | "saved">("idle");

/** Save the social graph to the cache */
export async function persistGraph(): Promise<void> {
  const graph = socialGraph$.value;
  const size = graph.size();

  saveState$.next("saving");
  try {
    if (size.users === 0) {
      log("Social graph is empty, deleting cache");
      await idbKeyValueStore.deleteItem(cacheKey);
    } else {
      log(`Saving social graph (${size.users} users, ${size.mutes} mutes)`);
      const blob = await graph.toBinary();
      await idbKeyValueStore.setItem(cacheKey, blob);
      log(`Saved social graph to cache (${formatBytes(blob.length)})`);
    }
    saveState$.next("saved");
    setTimeout(() => {
      if (saveState$.value === "saved") saveState$.next("idle");
    }, 2000);
  } catch (err) {
    saveState$.next("idle");
    throw err;
  }
}

/** Backwards-compatible alias for {@link persistGraph} */
export const saveSocialGraph = persistGraph;

/** Loads the social graph from local storage if a cached blob is present */
async function loadGraph(): Promise<void> {
  const cached = (await idbKeyValueStore.getItem(cacheKey)) as Uint8Array | undefined;
  if (!cached) return;

  const root = accounts.active?.pubkey ?? SOCIAL_GRAPH_FALLBACK_PUBKEY;
  const graph = await SocialGraph.fromBinary(root, cached);
  log(`Loaded social graph from cache with ${graph.size().users} users (${formatBytes(cached.length)})`);
  socialGraph$.next(graph);
}

/** Returns the root user's outbox relays from the event store, if available */
function getRootOutboxes(): string[] | undefined {
  const root = socialGraph$.value.getRoot();
  const mailboxes = eventStore.getReplaceable(kinds.RelayList, root);
  return mailboxes ? getOutboxes(mailboxes) : undefined;
}

/** Start a new social graph crawler */
export function startSocialGraphSync(opts: { relays?: string[]; distance: number; since?: number }): void {
  // Cancel any previous sync first
  stopSocialGraphSync();

  const root = socialGraph$.value.getRoot();
  const relays = opts.relays ?? getRootOutboxes();

  // Reset the sync state
  syncState$.next({ loaded: 0 });

  log(`Starting social graph sync (distance=${opts.distance}, relays=${relays?.join(",") ?? "default"})`);

  const sub = socialGraphLoader({
    pubkey: root,
    relays,
    distance: opts.distance,
    since: opts.since,
  })
    .pipe(
      tap((event) => socialGraph$.value.handleEvent(event)),
      mapEventsToStore(eventStore),
      tap(() => {
        const current = syncState$.value ?? { loaded: 0 };
        syncState$.next({ loaded: current.loaded + 1 });
      }),
      throttleTime(1000),
      exhaustMap(async () => {
        await socialGraph$.value.recalculateFollowDistances();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }),
    )
    .subscribe({
      next: () => {
        socialGraph$.next(socialGraph$.value);
      },
      complete: () => {
        sync$.next(null);
        localSettings.lastUpdatedSocialGraph.next(Date.now());
        const size = socialGraph$.value.size();
        log(`Social graph sync complete (${size.users} users, ${size.mutes} mutes)`);
        persistGraph().catch((err) => log("Failed to persist social graph", err));
      },
    });

  sync$.next(sub);
}

/** Cancel the current running sync */
export function stopSocialGraphSync(): void {
  const sub = sync$.value;
  if (sub) {
    sub.unsubscribe();
    sync$.next(null);
  }
}

/** Clears the social graph and the cached blob from storage */
export async function clearSocialGraph(): Promise<void> {
  stopSocialGraphSync();
  const root = socialGraph$.value.getRoot();
  const emptyGraph = new SocialGraph(root);
  socialGraph$.next(emptyGraph);
  syncState$.next(null);
  await idbKeyValueStore.deleteItem(cacheKey);
}

// NOTE: social graph is killing android for some reason (probably too much data in JS thread)
if (CAP_IS_WEB) {
  // Load the social graph from the cache on boot
  console.time("SocialGraph:load");
  await loadGraph();
  console.timeEnd("SocialGraph:load");

  // Auto-save throttled whenever the graph is updated
  socialGraph$
    .pipe(
      skip(1),
      throttleTime(20_000),
      exhaustMap(() => persistGraph()),
    )
    .subscribe();
}

// Set the social graph root to the active account pubkey
combineLatest([socialGraph$, accounts.active$]).subscribe(([graph, account]) => {
  graph.setRoot(account?.pubkey ?? SOCIAL_GRAPH_FALLBACK_PUBKEY);
});

/** Sort an array of things by their authors distance from the root */
export function sortByDistanceAndConnections(keys: string[]): string[];
export function sortByDistanceAndConnections<T>(keys: T[], getKey: (d: T) => string): T[];
export function sortByDistanceAndConnections<T>(keys: T[], getKey?: (d: T) => string): T[] {
  return Array.from(keys).sort((a, b) => {
    const aKey = typeof a === "string" ? a : getKey?.(a) || "";
    const bKey = typeof b === "string" ? b : getKey?.(b) || "";

    const v = sortComparePubkeys(aKey, bKey);
    if (v === 0) {
      // tied break with original index
      const ai = keys.indexOf(a);
      const bi = keys.indexOf(b);
      if (ai < bi) return -1;
      else if (ai > bi) return 1;
      return 0;
    }
    return v;
  });
}

/** Compare the distance of two pubkeys from the root */
export function sortComparePubkeys(a: string, b: string) {
  const graph = socialGraph$.value;
  const aDist = graph.getFollowDistance(a);
  const bDist = graph.getFollowDistance(b);
  return aDist - bDist;
}

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.socialGraph = socialGraph$;
}
