import { ReplaceableLoader } from "applesauce-loaders/loaders";

import { eventStore } from "./event-store";
import { nostrRequest } from "./pool";
import { DEFAULT_LOOKUP_RELAYS } from "../const";
import { cacheRequest } from "./cache-relay";
import localSettings from "./local-settings";

const replaceableEventLoader = new ReplaceableLoader(nostrRequest, {
  cacheRequest,
  lookupRelays: DEFAULT_LOOKUP_RELAYS,
});

// Subscribe to loader and send events to event store
replaceableEventLoader.subscribe((event) => eventStore.add(event));

// Set loaders extra relays to app relays
localSettings.readRelays.subscribe((relays) => {
  replaceableEventLoader.extraRelays = relays;
});

if (import.meta.env.DEV) {
  //@ts-expect-error debug
  window.replaceableEventLoader = replaceableEventLoader;
}

export default replaceableEventLoader;
