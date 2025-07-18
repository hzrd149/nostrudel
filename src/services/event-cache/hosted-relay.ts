import { markFromCache } from "applesauce-core/helpers";
import { Relay } from "applesauce-relay";
import { firstValueFrom, tap } from "rxjs";
import { EventCache } from "./interface";

if (!window.CACHE_RELAY_ENABLED) throw new Error("Cache relay is not avaliable");

const protocol = location.protocol === "https:" ? "wss:" : "ws:";
const relay = new Relay(new URL(protocol + location.host + "/local-relay").toString());
relay.keepAlive = 1000 * 60 * 5; // 5 minutes

// Ensure the relay is available
await firstValueFrom(relay.request({ limit: 1 }));

const hostedRelayCache: EventCache = {
  type: "hosted",
  read: (filters) => relay.request(filters).pipe(tap((e) => markFromCache(e))),
  write: (events) => {
    return Promise.all(events.map((event) => relay.publish(event)));
  },
};

export default hostedRelayCache;
