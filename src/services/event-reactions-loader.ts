import { kinds } from "nostr-tools";
import { AddressPointer, EventPointer } from "nostr-tools/nip19";
import { getCoordinateFromAddressPointer, isAddressPointer, isEventPointer } from "applesauce-core/helpers";

import { cacheRequest } from "./cache-relay";
import { TagValueLoader } from "applesauce-loaders";
import rxNostr from "./rx-nostr";
import { eventStore } from "./event-store";

export function requestReactions(id: string | EventPointer | AddressPointer, relays: string[], force?: boolean) {
  if (typeof id === "string") {
    if (id.includes(":")) replaceableEventsZapsLoader.next({ value: id, relays, force });
    else singleEventsZapsLoader.next({ value: id, relays, force });
  } else if (isEventPointer(id)) {
    singleEventsZapsLoader.next({ value: id.id, relays, force });
  } else if (isAddressPointer(id)) {
    replaceableEventsZapsLoader.next({ value: getCoordinateFromAddressPointer(id), relays, force });
  }
}

const replaceableEventsZapsLoader = new TagValueLoader(rxNostr, "a", {
  name: "reactions",
  kinds: [kinds.Reaction],
  cacheRequest,
});
const singleEventsZapsLoader = new TagValueLoader(rxNostr, "e", {
  name: "reactions",
  kinds: [kinds.Reaction],
  cacheRequest,
});

// start the loader and send all events to the event store
replaceableEventsZapsLoader.subscribe((packet) => {
  eventStore.add(packet.event, packet.from);
});
singleEventsZapsLoader.subscribe((packet) => {
  eventStore.add(packet.event, packet.from);
});
