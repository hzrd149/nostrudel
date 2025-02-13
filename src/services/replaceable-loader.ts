import { ReplaceableLoader } from "applesauce-loaders/loaders";

import { eventStore } from "./event-store";
import rxNostr from "./rx-nostr";
import { COMMON_CONTACT_RELAYS } from "../const";
import { cacheRequest } from "./cache-relay";

const replaceableEventLoader = new ReplaceableLoader(rxNostr, {
  cacheRequest,
  lookupRelays: COMMON_CONTACT_RELAYS,
});

replaceableEventLoader.subscribe((packet) => eventStore.add(packet.event, packet.from));

if (import.meta.env.DEV) {
  //@ts-expect-error debug
  window.replaceableEventLoader = replaceableEventLoader;
}

export default replaceableEventLoader;
