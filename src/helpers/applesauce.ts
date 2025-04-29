import { NostrPublishMethod, NostrSubscriptionMethod } from "applesauce-signers";
import { createRxForwardReq } from "rx-nostr";
import { lastValueFrom, Observable } from "rxjs";

import rxNostr from "../services/rx-nostr";

export const nostrConnectSubscription: NostrSubscriptionMethod = (relays, filters) => {
  return new Observable((observer) => {
    const req = createRxForwardReq();

    const observable = rxNostr.use(req, { on: { relays } });

    // hack to ensure subscription is active before sending filters
    const sub = observable.subscribe((p) => observer.next(p.event));

    req.emit(filters);
    return sub;
  });
};
export const nostrConnectPublish: NostrPublishMethod = async (relays, event) => {
  await lastValueFrom(rxNostr.send(event, { on: { relays } }));
};
