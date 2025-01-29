import { EventStore, QueryStore } from "applesauce-core";
import { isFromCache } from "applesauce-core/helpers";

import { cacheRelay$ } from "./cache-relay";

export const eventStore = new EventStore();
export const queryStore = new QueryStore(eventStore);

if (import.meta.env.DEV) {
  // @ts-expect-error debug
  window.eventStore = eventStore;
  // @ts-expect-error debug
  window.queryStore = queryStore;
}

// save all events to cache relay
eventStore.database.inserted.subscribe((event) => {
  if (!isFromCache(event) && cacheRelay$.value) {
    cacheRelay$.value.publish(event);
  }
});
