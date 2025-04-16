import { ReplaceableLoader } from "applesauce-loaders/loaders";

import { eventStore } from "./event-store";
import { nostrRequest } from "./rx-nostr";
import { DEFAULT_LOOKUP_RELAYS } from "../const";
import { cacheRequest } from "./cache-relay";

const replaceableEventLoader = new ReplaceableLoader(nostrRequest, {
  cacheRequest,
  lookupRelays: DEFAULT_LOOKUP_RELAYS,
});

replaceableEventLoader.subscribe((event) => eventStore.add(event));

if (import.meta.env.DEV) {
  //@ts-expect-error debug
  window.replaceableEventLoader = replaceableEventLoader;
}

export default replaceableEventLoader;
