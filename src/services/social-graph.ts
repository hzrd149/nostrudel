import { SerializedSocialGraph, SocialGraph } from "nostr-social-graph";
import { kinds } from "nostr-tools";
import { BehaviorSubject, combineLatest, firstValueFrom, take, tap, throttleTime } from "rxjs";

import { SOCIAL_GRAPH_FALLBACK_PUBKEY } from "../const";
import { logger } from "../helpers/debug";
import accounts from "./accounts";
import idbKeyValueStore from "./database/kv";
import { eventStore } from "./event-store";

const log = logger.extend("SocialGraph");
const cacheKey = "social-graph";

// Load the social graph from the cache
const cached = await idbKeyValueStore.getItem<SerializedSocialGraph>(cacheKey);

/** An observable that emits the social graph for the active account */
export const socialGraph$ = new BehaviorSubject<SocialGraph>(
  new SocialGraph(accounts.active?.pubkey ?? SOCIAL_GRAPH_FALLBACK_PUBKEY, cached),
);

const size = socialGraph$.value.size();
log(`Loaded social graph from cache (${size.users} users, ${size.mutes} mutes)`);

// Set the social graph root to the active account pubkey
combineLatest([socialGraph$, accounts.active$]).subscribe(([graph, account]) => {
  graph.setRoot(account?.pubkey ?? SOCIAL_GRAPH_FALLBACK_PUBKEY);
});

// Update the social graph with all contacts and mutelist events
combineLatest([
  // Take the first value so re don't get recursive updates
  socialGraph$.pipe(take(1)),
  eventStore.filters({ kinds: [kinds.Contacts, kinds.Mutelist] }),
])
  .pipe(
    // Add event to graph
    tap(([graph, event]) => graph.handleEvent(event)),
    // Only update the graph every 1 second
    throttleTime(1000),
  )
  .subscribe(([graph]) => {
    graph.recalculateFollowDistances();
    // Notify subscribers of the updated graph
    socialGraph$.next(graph);
  });

// Save the active users social graph at most every 10 seconds
socialGraph$.pipe(throttleTime(10_000)).subscribe(saveSocialGraph);

/** Save the social graph to the cache */
export function saveSocialGraph(graph: SocialGraph) {
  const size = graph.size();
  log(`Saving social graph (${size.users} users, ${size.mutes} mutes)`);
  idbKeyValueStore.setItem(cacheKey, graph.serialize());
}

/** Exports the social graph to a file */
export async function exportGraph() {
  const graph = await firstValueFrom(socialGraph$);
  const data = graph.serialize();
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
      file.text().then(async (json) => {
        try {
          const graph = await firstValueFrom(socialGraph$);
          const data = JSON.parse(json);
          graph.merge(new SocialGraph(graph.getRoot(), data));
          saveSocialGraph(graph);
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
  window.socialGraph = socialGraph$;
}
