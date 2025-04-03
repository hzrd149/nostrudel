import { ReplaceableLoader } from "applesauce-loaders/loaders";

import { eventStore } from "./event-store";
import { nostrRequest } from "./rx-nostr";
import { COMMON_CONTACT_RELAYS } from "../const";
import { cacheRequest } from "./cache-relay";

const replaceableEventLoader = new ReplaceableLoader(nostrRequest, {
  cacheRequest,
  lookupRelays: COMMON_CONTACT_RELAYS,
});

replaceableEventLoader.subscribe((event) => eventStore.add(event));

if (import.meta.env.DEV) {
  //@ts-expect-error debug
  window.replaceableEventLoader = replaceableEventLoader;
}

export default replaceableEventLoader;
