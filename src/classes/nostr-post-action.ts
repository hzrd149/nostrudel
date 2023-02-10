import { Subject, Subscription } from "rxjs";
import relayPoolService from "../services/relay-pool";
import { NostrEvent } from "../types/nostr-event";

export type PostResult = { url: string; message?: string; status: boolean };

export function nostrPostAction(relays: string[], event: NostrEvent, timeout: number = 5000) {
  const subject = new Subject<PostResult>();
  let remaining = new Set<Subscription>();

  for (const url of relays) {
    const relay = relayPoolService.requestRelay(url);

    const sub = relay.onCommandResult.subscribe((result) => {
      if (result.eventId === event.id) {
        subject.next({
          url,
          status: result.status,
          message: result.message,
        });

        sub.unsubscribe();
        remaining.delete(sub);
        if (remaining.size === 0) subject.complete();
      }
    });
    remaining.add(sub);

    // send event
    relay.send(["EVENT", event]);
  }

  setTimeout(() => {
    if (remaining.size > 0) {
      for (const sub of remaining) {
        sub.unsubscribe();
      }
      subject.complete();
    }
  }, timeout);

  return subject;
}
