import { BehaviorSubject } from "rxjs";
import { relayPool } from "./relays";

const eventRelays = new Map<string, BehaviorSubject<string[]>>();

export function getEventRelays(id: string) {
  let relays = eventRelays.get(id);
  if (!relays) {
    relays = new BehaviorSubject<string[]>([]);
    eventRelays.set(id, relays);
  }
  return relays;
}

relayPool.onRelayCreated.subscribe((relay) => {
  relay.onEvent.subscribe(({ body: event }) => {
    const relays = getEventRelays(event.id);

    if (!relays.value.includes(relay.url)) {
      relays.next(relays.value.concat(relay.url));
    }
  });
});
