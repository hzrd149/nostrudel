import { EventStore } from "applesauce-core";
import { isFromCache } from "applesauce-core/helpers";
import verifyEvent from "./verify-event";

export const eventStore = new EventStore();

// verify all events added to the store
eventStore.verifyEvent = (event) => {
  return isFromCache(event) || verifyEvent(event);
};

if (import.meta.env.DEV) {
  // @ts-expect-error debug
  window.eventStore = eventStore;
}
