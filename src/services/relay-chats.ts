import { onlyEvents } from "applesauce-relay";
import { storeEvents } from "applesauce-relay/operators";
import { NostrEvent } from "nostr-tools";
import { Observable, repeat, retry, share, tap, timer } from "rxjs";

import { eventStore } from "./event-store";
import pool from "./pool";
import { logger } from "../helpers/debug";

export const RELAY_CHAT_MESSAGE_KIND = 23333;

const log = logger.extend("RelayChat");
const subscriptions = new Map<string, Observable<NostrEvent>>();

export function getRelayChatSubscription(relay: string): Observable<NostrEvent> {
  if (subscriptions.has(relay)) return subscriptions.get(relay)!;

  const subscription = pool.subscription([relay], { kinds: [RELAY_CHAT_MESSAGE_KIND] }).pipe(
    repeat(),
    retry(),
    storeEvents(eventStore),
    onlyEvents(),
    tap({
      complete: () => {
        log(`Closed subscription to ${relay}`);
      },
    }),
    share({ resetOnRefCountZero: () => timer(120_000) }),
  );

  subscriptions.set(relay, subscription);
  return subscription;
}
