import { BehaviorSubject } from "rxjs";
import { Relay } from "../classes/relay";
import { NostrEvent } from "../types/nostr-event";
import relayPoolService from "./relay-pool";

const eventRelays = new Map<string, BehaviorSubject<string[]>>();

export function getEventRelays(id: string) {
  let relays = eventRelays.get(id);
  if (!relays) {
    relays = new BehaviorSubject<string[]>([]);
    eventRelays.set(id, relays);
  }
  return relays;
}

export function handleEventFromRelay(relay: Relay, event: NostrEvent) {
  const relays = getEventRelays(event.id);

  if (!relays.value.includes(relay.url)) {
    relays.next(relays.value.concat(relay.url));
  }
}

relayPoolService.onRelayCreated.subscribe((relay) => {
  relay.onEvent.subscribe(({ body: event }) => {
    handleEventFromRelay(relay, event);
  });
});
