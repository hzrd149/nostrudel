import Relay from "../classes/relay";
import { PersistentSubject } from "../classes/subject";
import { getEventUID } from "../helpers/nostr/event";
import { NostrEvent } from "../types/nostr-event";
import relayPoolService from "./relay-pool";

const eventRelays = new Map<string, PersistentSubject<string[]>>();

export function getEventRelays(id: string) {
  let relays = eventRelays.get(id);
  if (!relays) {
    relays = new PersistentSubject<string[]>([]);
    eventRelays.set(id, relays);
  }
  return relays;
}

function addRelay(id: string, relay: string) {
  const relays = getEventRelays(id);

  if (!relays.value.includes(relay)) {
    relays.next(relays.value.concat(relay));
  }
}

export function handleEventFromRelay(relay: Relay, event: NostrEvent) {
  const uid = getEventUID(event);

  addRelay(uid, relay.url);
  if (event.id !== uid) addRelay(event.id, relay.url);
}

relayPoolService.onRelayCreated.subscribe((relay) => {
  relay.onEvent.subscribe((message) => {
    handleEventFromRelay(relay, message[2]);
  });
});

const eventRelaysService = {
  getEventRelays,
  handleEventFromRelay,
};

if (import.meta.env.DEV) {
  //@ts-ignore
  window.eventRelaysService = eventRelaysService;
}

export default eventRelaysService;
