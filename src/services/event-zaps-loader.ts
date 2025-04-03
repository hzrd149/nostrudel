import { kinds } from "nostr-tools";
import { getCoordinateFromAddressPointer, isAddressPointer, isEventPointer } from "applesauce-core/helpers";
import { AddressPointer, EventPointer } from "nostr-tools/nip19";
import { TagValueLoader } from "applesauce-loaders";

import { cacheRequest } from "./cache-relay";
import { nostrRequest } from "./rx-nostr";
import { eventStore } from "./event-store";

export function requestZaps(id: string | EventPointer | AddressPointer, relays: string[], force?: boolean) {
  if (typeof id === "string") {
    if (id.includes(":")) replaceableEventsZapsLoader.next({ value: id, relays, force });
    else singleEventsZapsLoader.next({ value: id, relays, force });
  } else if (isEventPointer(id)) {
    singleEventsZapsLoader.next({ value: id.id, relays, force });
  } else if (isAddressPointer(id)) {
    replaceableEventsZapsLoader.next({ value: getCoordinateFromAddressPointer(id), relays, force });
  }
}

const replaceableEventsZapsLoader = new TagValueLoader(nostrRequest, "a", {
  name: "zaps",
  kinds: [kinds.Zap],
  cacheRequest,
});
const singleEventsZapsLoader = new TagValueLoader(nostrRequest, "e", {
  name: "zaps",
  kinds: [kinds.Zap],
  cacheRequest,
});

// start the loader and send all events to the event store
replaceableEventsZapsLoader.subscribe((event) => eventStore.add(event));
singleEventsZapsLoader.subscribe((event) => eventStore.add(event));
