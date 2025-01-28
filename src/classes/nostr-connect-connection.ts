import { NostrConnectConnectionMethods } from "applesauce-signers";
import { Filter, NostrEvent } from "nostr-tools";
import { MultiSubscription } from "applesauce-net/subscription";

import relayPoolService from "../services/relay-pool";

export function createNostrConnectConnection(): NostrConnectConnectionMethods {
  const sub = new MultiSubscription(relayPoolService);

  const onPublishEvent = async (event: NostrEvent, relays: string[]) => {
    // publish event to each relay
    await Promise.allSettled(
      relays.map(async (url) => {
        const relay = relayPoolService.requestRelay(url, true);
        await relayPoolService.waitForOpen(relay);
        await relay.publish(event);
      }),
    );
  };

  const onSubOpen = async (filters: Filter[], relays: string[], onEvent: (event: NostrEvent) => void) => {
    sub.setFilters(filters);
    sub.setRelays(relays);
    sub.open();

    sub.onEvent.subscribe(onEvent);

    await sub.waitForAllConnection();
  };

  const onSubClose = async () => {
    sub.close();
  };

  return { onSubClose, onPublishEvent, onSubOpen };
}
