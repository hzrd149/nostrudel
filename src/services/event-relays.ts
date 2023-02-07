import { BehaviorSubject } from "rxjs";
import { NostrEvent } from "../types/nostr-event";
import { Relay, relayPool } from "./relays";

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

relayPool.onRelayCreated.subscribe((relay) => {
  relay.onEvent.subscribe(({ body: event }) => {
    handleEventFromRelay(relay, event);
  });
});
