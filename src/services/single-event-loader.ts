import _throttle from "lodash.throttle";
import { SingleEventLoader } from "applesauce-loaders";

import { eventStore } from "./event-store";
import rxNostr from "./rx-nostr";
import { cacheRequest } from "./replaceable-event-loader";

const singleEventLoader = new SingleEventLoader(rxNostr, { cacheRequest });

singleEventLoader.subscribe((packet) => eventStore.add(packet.event, packet.from));

if (import.meta.env.DEV) {
  //@ts-expect-error
  window.singleEventLoader = singleEventLoader;
}

export default singleEventLoader;
