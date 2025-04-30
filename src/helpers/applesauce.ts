import { NostrPublishMethod, NostrSubscriptionMethod } from "applesauce-signers";
import { lastValueFrom } from "rxjs";

import { onlyEvents } from "applesauce-relay";
import pool from "../services/pool";

export const nostrConnectSubscription: NostrSubscriptionMethod = (relays, filters) => {
  return pool.subscription(relays, filters).pipe(onlyEvents());
};
export const nostrConnectPublish: NostrPublishMethod = async (relays, event) => {
  await lastValueFrom(pool.publish(relays, event));
};
