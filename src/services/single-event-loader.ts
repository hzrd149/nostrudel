import _throttle from "lodash.throttle";
import { SingleEventLoader } from "applesauce-loaders";

import { eventStore } from "./event-store";
import { nostrRequest } from "./pool";
import { cacheRequest } from "./cache-relay";
import localSettings from "./local-settings";

const singleEventLoader = new SingleEventLoader(nostrRequest, { cacheRequest });

singleEventLoader.subscribe((event) => eventStore.add(event));

// Set loaders extra relays to app relays
localSettings.readRelays.subscribe((relays) => {
  singleEventLoader.extraRelays = relays;
});

if (import.meta.env.DEV) {
  //@ts-expect-error
  window.singleEventLoader = singleEventLoader;
}

export default singleEventLoader;
