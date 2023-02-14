import relayPoolService from "../services/relay-pool";
import { NostrEvent } from "../types/nostr-event";
import createDefer from "./deferred";
import { IncomingCommandResult, Relay } from "./relay";
import { ListenerFn, Subject } from "./subject";

export type PostResult = { url: string; message?: string; status: boolean };

export function nostrPostAction(relays: string[], event: NostrEvent, timeout: number = 5000) {
  const subject = new Subject<PostResult>();
  const onComplete = createDefer<void>();
  const remaining = new Map<Relay, ListenerFn<IncomingCommandResult>>();

  for (const url of relays) {
    const relay = relayPoolService.requestRelay(url);

    const handler = (result: IncomingCommandResult) => {
      if (result.eventId === event.id) {
        subject.next({
          url,
          status: result.status,
          message: result.message,
        });

        relay.onCommandResult.unsubscribe(handler);
        remaining.delete(relay);
        if (remaining.size === 0) onComplete.resolve();
      }
    };
    relay.onCommandResult.subscribe(handler);
    remaining.set(relay, handler);

    // send event
    relay.send(["EVENT", event]);
  }

  setTimeout(() => {
    if (remaining.size > 0) {
      for (const [relay, handler] of remaining) {
        relay.onCommandResult.unsubscribe(handler);
      }
      onComplete.resolve();
    }
  }, timeout);

  return {
    results: subject,
    onComplete,
  };
}
