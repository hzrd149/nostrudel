import _throttle from "lodash.throttle";
import { SingleEventLoader } from "applesauce-loaders";

import { eventStore } from "./event-store";
import { nostrRequest } from "./rx-nostr";
import { cacheRequest } from "./cache-relay";

const singleEventLoader = new SingleEventLoader(nostrRequest, { cacheRequest });

singleEventLoader.subscribe((event) => eventStore.add(event));

if (import.meta.env.DEV) {
  //@ts-expect-error
  window.singleEventLoader = singleEventLoader;
}

export default singleEventLoader;
