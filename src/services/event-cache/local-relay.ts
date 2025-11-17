import { markFromCache } from "applesauce-core/helpers";
import { completeOnEose, Relay } from "applesauce-relay";
import { tap } from "rxjs";

import { LOCAL_RELAY_URL } from "../../const";
import { EventCache } from "./interface";

const relay = new Relay(LOCAL_RELAY_URL);
relay.keepAlive = 1000 * 60 * 5; // 5 minutes

const localRelayCache: EventCache = {
  type: "local-relay",
  read: (filters) =>
    relay.req(filters).pipe(
      completeOnEose(),
      tap((e) => markFromCache(e)),
    ),
  write: (events) => {
    return Promise.all(events.map((event) => relay.event(event)));
  },
  search: (filters) => relay.req(filters).pipe(completeOnEose()),
};

export default localRelayCache;
