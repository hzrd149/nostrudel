import { getProfilePointersFromList, mergeRelaySets } from "applesauce-core/helpers";
import { SerializedSocialGraph, SocialGraph } from "nostr-social-graph";
import { Filter, NostrEvent, kinds as nostrKinds } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";
import {
  bufferTime,
  combineLatest,
  distinct,
  filter,
  ignoreElements,
  merge,
  mergeMap,
  Observable,
  of,
  scan,
  startWith,
  Subject,
  Subscription,
  take,
  tap,
} from "rxjs";

import { SOCIAL_GRAPH_FALLBACK_PUBKEY } from "../const";
import { logger } from "../helpers/debug";
import accounts from "./accounts";
import idbKeyValueStore from "./database/kv";
import { eventStore } from "./event-store";
import replaceableEventLoader from "./replaceable-loader";

const log = logger.extend("SocialGraph");
const cacheKey = "social-graph";

let socialGraph: SocialGraph;

// load cached social graph
const cached = await idbKeyValueStore.getItem<SerializedSocialGraph>(cacheKey);
if (cached) {
  socialGraph = new SocialGraph(accounts.active?.pubkey || SOCIAL_GRAPH_FALLBACK_PUBKEY, cached);
  log(`Loaded social graph from cache (size: ${socialGraph.size()})`);
} else socialGraph = new SocialGraph(accounts.active?.pubkey || SOCIAL_GRAPH_FALLBACK_PUBKEY);

export async function saveSocialGraph() {
  log(`Saving social graph`);
  await idbKeyValueStore.setItem(cacheKey, socialGraph.serialize());
}

/** Make a request to load a list of users in the social graph and return an observable that completes with finished loading */
type GraphLoaderRequest = (pointers: ProfilePointer) => Observable<NostrEvent>;

export function createBatchUserLoader(
  request: (relays: string[], filters: Filter[]) => Observable<NostrEvent>,
  kinds: number[] = [nostrKinds.Contacts, nostrKinds.Metadata, nostrKinds.Mutelist],
): GraphLoaderRequest {
  const input = new Subject<ProfilePointer>();

  const output = input.pipe(
    // skip duplicates
    distinct((user) => user.pubkey),
    // buffer for 1 second
    bufferTime(1_000),
    // merge users into a single request
    mergeMap((users) => {
      const filter: Filter = { kinds, authors: users.map((u) => u.pubkey) };
      const relays = mergeRelaySets(...users.map((u) => u.relays));
      return request(relays, [filter]);
    }),
  );

  return (user) => {
    input.next(user);
    return output;
  };
}

export function graphLoader(root: string | ProfilePointer, maxDistance: number = 2, request: GraphLoaderRequest) {
  return new Observable<{ total: number; loaded: number }>((observer) => {
    // Keep track of all loaded and discovered users
    const loaded = new Set<string>();
    const found = new Set<string>();

    // Queue of users to load
    const queue: [ProfilePointer, number][] = [];

    // Add root to queue
    queue.push([typeof root === "string" ? { pubkey: root } : root, 0]);

    // Keep track of all subscriptions
    const subscriptions: Subscription[] = [];

    // Start loading users
    while (queue.length > 0) {
      const [pointer, distance] = queue.shift()!;
      if (distance > maxDistance) continue;

      // Don't load the same user twice
      if (loaded.has(pointer.pubkey)) continue;
      loaded.add(pointer.pubkey);
      found.add(pointer.pubkey);

      // Update progress
      observer.next({ total: found.size, loaded: loaded.size });

      // Load the user
      const sub = request(pointer)
        .pipe(
          filter((e) => e.kind === nostrKinds.Contacts && e.pubkey === pointer.pubkey),
          take(1),
        )
        .subscribe((event) => {
          // Temp: add events to the store
          eventStore.add(event);

          const contacts = getProfilePointersFromList(event);
          log(`Loaded contacts for ${pointer.pubkey}`, contacts);

          if (distance < maxDistance) {
            for (const pointer of contacts) {
              if (found.has(pointer.pubkey)) continue;
              found.add(pointer.pubkey);

              // Add the user to the queue to be loaded
              queue.push([pointer, distance + 1]);
            }
          }

          // Update progress
          observer.next({ total: found.size, loaded: loaded.size });
        });

      subscriptions.push(sub);
    }

    // complete the loader when queue is empty
    // observer.complete();

    // return cleanup
    return () => {
      for (const subscription of subscriptions) subscription.unsubscribe();
    };
  });
}

export function crawlFollowGraph(
  root: string | ProfilePointer,
  maxDistance: number = 2,
): Observable<{ total: number; loaded: number }> {
  log(`Started crawling follow graph`);

  const loaded = new Subject<NostrEvent>();
  const input = new Subject<[ProfilePointer, number]>();

  const queue = input.pipe(
    // Don't load users who are too far
    filter(([_user, distance]) => distance <= maxDistance),
    // only load users once
    distinct(([user]) => user.pubkey),
    // Start with the root user
    startWith([typeof root === "string" ? { pubkey: root } : root, 0] as const),
  );

  // Create observable for progress
  const progress = combineLatest({
    total: queue.pipe(scan((acc) => acc + 1, 0)),
    loaded: loaded.pipe(scan((acc) => acc + 1, 0)),
  });

  const loader = queue.pipe(
    // create new observable to load each user
    mergeMap(([user, distance]) => {
      log(`Loading contacts for ${user.pubkey}`);
      replaceableEventLoader.next({ kind: nostrKinds.Contacts, ...user });

      const event = eventStore.getReplaceable(nostrKinds.Contacts, user.pubkey);

      return (
        event
          ? of(event)
          : eventStore.inserts.pipe(
              // Wait for the contacts event to be loaded
              filter((e) => e.kind === nostrKinds.Contacts && e.pubkey === user.pubkey),
              // Take the first event
              take(1),
            )
      ).pipe(
        // Add contacts to the queue
        tap((event) => {
          loaded.next(event);

          const contacts = getProfilePointersFromList(event);
          log(`Loaded contacts for ${user.pubkey}`, contacts);

          // Add the user to the queue to be loaded
          for (const pointer of contacts) input.next([pointer, distance + 1]);
        }),
        // Ignore loaded events
        ignoreElements(),
      );
    }),
  );

  return merge(loader, progress);
}

/** Exports the social graph to a file */
export function exportGraph() {
  const data = socialGraph.serialize();
  const url = URL.createObjectURL(
    new File([JSON.stringify(data)], "social_graph.json", {
      type: "text/json",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "social_graph.json";
  a.click();
}

/** Loads a social graph from a file and merges it with the existing graph */
export function importGraph() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.multiple = false;
  input.onchange = () => {
    if (input.files?.length) {
      const file = input.files[0];
      file.text().then((json) => {
        try {
          const data = JSON.parse(json);
          socialGraph.merge(new SocialGraph(socialGraph.getRoot(), data));
        } catch (e) {
          console.error("failed to load social graph from file:", e);
        }
      });
    }
  };
  input.click();
}

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.socialGraph = socialGraph;

  // @ts-expect-error
  window.saveSocialGraph = saveSocialGraph;
}

export { socialGraph };
