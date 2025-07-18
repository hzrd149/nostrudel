import { markFromCache } from "applesauce-core/helpers";
import { Relay } from "applesauce-relay";
import { tap } from "rxjs";

import { LOCAL_RELAY_URL } from "../../const";
import { EventCache } from "./interface";

const relay = new Relay(LOCAL_RELAY_URL);
relay.keepAlive = 1000 * 60 * 5; // 5 minutes

const localRelayCache: EventCache = {
  type: "local-relay",
  read: (filters) => relay.request(filters).pipe(tap((e) => markFromCache(e))),
  write: (events) => {
    return Promise.all(events.map((event) => relay.publish(event)));
  },
  search: (filters) => relay.request(filters),
};

export default localRelayCache;
