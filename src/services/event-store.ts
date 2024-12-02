import { EventStore, QueryStore } from "applesauce-core";

export const eventStore = new EventStore();
export const queryStore = new QueryStore(eventStore);

if (import.meta.env.DEV) {
  // @ts-expect-error debug
  window.eventStore = eventStore;
  // @ts-expect-error debug
  window.queryStore = queryStore;
}
