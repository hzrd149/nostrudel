import { SocialGraph } from "nostr-social-graph";
import { kinds, NostrEvent } from "nostr-tools";
import {
  BehaviorSubject,
  combineLatest,
  exhaustMap,
  finalize,
  map,
  Observable,
  scan,
  skip,
  tap,
  throttleTime,
} from "rxjs";

import { SOCIAL_GRAPH_FALLBACK_PUBKEY } from "../const";
import { logger } from "../helpers/debug";
import accounts from "./accounts";
import idbKeyValueStore from "./database/kv";
import { eventStore } from "./event-store";
import { socialGraphLoader } from "./loaders";

const log = logger.extend("SocialGraph");
const cacheKey = "social-graph";

log("Social graph initializing...");

// Load the social graph from the cache
const cached = (await idbKeyValueStore.getItem(cacheKey)) as Uint8Array | undefined;

/** An observable that emits the social graph for the active account */
export const socialGraph$ = new BehaviorSubject<SocialGraph>(
  new SocialGraph(accounts.active?.pubkey ?? SOCIAL_GRAPH_FALLBACK_PUBKEY),
);

function autoSave() {
  socialGraph$
    .pipe(
      skip(1),
      throttleTime(10_000),
      exhaustMap((graph) => saveSocialGraph(graph)),
    )
    .subscribe();
}

// Load the social graph from the cache and start auto saving
if (cached) {
  SocialGraph.fromBinary(accounts.active?.pubkey ?? SOCIAL_GRAPH_FALLBACK_PUBKEY, cached).then((graph) => {
    socialGraph$.next(graph);

    autoSave();
  });
} else {
  autoSave();
}

// Set the social graph root to the active account pubkey
combineLatest([socialGraph$, accounts.active$]).subscribe(([graph, account]) => {
  graph.setRoot(account?.pubkey ?? SOCIAL_GRAPH_FALLBACK_PUBKEY);
});

// Update the social graph with all contacts and mutelist events
eventStore
  .filters({ kinds: [kinds.Contacts, kinds.Mutelist] })
  .pipe(
    // Add event to graph
    tap((event) => socialGraph$.value.handleEvent(event)),
    // Only update the graph every 15s
    throttleTime(15_000),
  )
  .subscribe(() => {
    // Notify subscribers of the updated graph
    socialGraph$.next(socialGraph$.value);
  });

/** Save the social graph to the cache */
export async function saveSocialGraph(graph: SocialGraph) {
  const size = graph.size();

  // Don't save empty graphs
  if (size.users === 0) {
    await idbKeyValueStore.deleteItem(cacheKey);
    return;
  } else {
    log(`Saving social graph (${size.users} users, ${size.mutes} mutes)`);
    await idbKeyValueStore.setItem(cacheKey, graph.toBinary());
    log("Saved social graph to cache");
  }
}

/** Updates the social graph out to a given distance */
export function updateSocialGraph(distance = 2): Observable<string> {
  const root = socialGraph$.value.getRoot();

  log(`Updating social graph out to ${distance} degrees`);
  return socialGraphLoader({ pubkey: root, distance }).pipe(
    scan((acc, events) => acc.concat(events), [] as NostrEvent[]),
    // Only update the graph every 10 seconds
    throttleTime(10_000),
    map((events) => {
      log("Updating social graph");
      // Notify subscribers of the updated graph
      socialGraph$.next(socialGraph$.value);

      return `Loaded ${events.length} follow lists`;
    }),
    finalize(() => {
      const size = socialGraph$.value.size();
      return `Social graph update complete (${size.users} users, ${size.mutes} mutes)`;
    }),
  );
}

/** Clears the social graph */
export async function clearSocialGraph() {
  const root = socialGraph$.value.getRoot();
  const emptyGraph = new SocialGraph(root);
  socialGraph$.next(emptyGraph);
  await idbKeyValueStore.deleteItem(cacheKey);
}

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
  return Math.abs(aDist - bDist);
}

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.socialGraph = socialGraph$;
}
