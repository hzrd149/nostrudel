import { getProfilePointersFromList } from "applesauce-core/helpers";
import { SerializedSocialGraph, SocialGraph } from "nostr-social-graph";
import { kinds } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";
import { distinct, filter, mergeMap, share, startWith, Subject, take, tap } from "rxjs";

import { SOCIAL_GRAPH_FALLBACK_PUBKEY } from "../const";
import accounts from "./accounts";
import idbKeyValueStore from "./database/kv";
import { eventStore } from "./event-store";
import replaceableEventLoader from "./replaceable-loader";
import { logger } from "../helpers/debug";

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

export function crawlFollowGraph(root: string | ProfilePointer, maxDistance: number = 2) {
  log(`Started crawling follow graph`);
  const loadUser = (user: ProfilePointer) => {
    const pubkey = typeof user === "string" ? user : user.pubkey;

    replaceableEventLoader.next({ kind: kinds.Contacts, ...user });
    return eventStore.filters({ kinds: [kinds.Contacts], authors: [pubkey] });
  };

  const queue = new Subject<[ProfilePointer, number]>();

  return queue.pipe(
    // Don't load users who are too far
    filter(([_user, distance]) => distance <= maxDistance),
    // only load users once
    distinct(([user]) => user.pubkey),
    // Start with the root user
    startWith([typeof root === "string" ? { pubkey: root } : root, 0] as const),
    // create new observable to load each user
    mergeMap(([user, distance]) =>
      loadUser(user).pipe(
        take(1),
        tap((event) => {
          const contacts = getProfilePointersFromList(event);
          // Add the user to the queue to be loaded
          for (const pointer of contacts) queue.next([pointer, distance + 1]);
        }),
      ),
    ),
    // only create a single loader
    share(),
  );
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
