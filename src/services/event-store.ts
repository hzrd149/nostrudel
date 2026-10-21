import { DeleteManager, EventStore } from "applesauce-core";
import { isFromCache } from "applesauce-core/helpers";
import { verifyStoreEvent } from "./verify-event";

export const eventDeleteManager = new DeleteManager();
export const eventStore = new EventStore({ deleteManager: eventDeleteManager });

// verify all events added to the store
eventStore.verifyEvent = (event) => {
  return isFromCache(event) || verifyStoreEvent(event);
};

if (import.meta.env.DEV) {
  Reflect.set(window, "eventStore", eventStore);
}
