import { nanoid } from "nanoid";
import { NostrEvent, AbstractRelay } from "nostr-tools";

import relayPoolService from "../services/relay-pool";
import createDefer from "./deferred";
import { PersistentSubject } from "./subject";
import ControlledObservable from "./controlled-observable";

type Result = { relay: AbstractRelay; success: boolean; message: string };

export default class NostrPublishAction {
  id = nanoid();
  label: string;
  relays: string[];
  event: NostrEvent;

  results = new PersistentSubject<Result[]>([]);

  onResult = new ControlledObservable<Result>();
  onComplete = createDefer<Result[]>();

  private remaining = new Set<AbstractRelay>();

  constructor(label: string, relays: Iterable<string>, event: NostrEvent, timeout: number = 5000) {
    this.label = label;
    this.relays = Array.from(relays);
    this.event = event;

    for (const url of relays) {
      const relay = relayPoolService.requestRelay(url);
      this.remaining.add(relay);

      relay
        .publish(event)
        .then((result) => this.handleResult(event.id, true, result, relay))
        .catch((err) => {
          if (err instanceof Error) this.handleResult(event.id, false, err.message, relay);
        });
    }

    setTimeout(this.handleTimeout.bind(this), timeout);
  }

  private handleResult(id: string, success: boolean, message: string, relay: AbstractRelay) {
    const result: Result = { relay, success, message };
    this.results.next([...this.results.value, result]);
    this.onResult.next(result);

    this.remaining.delete(relay);
    if (this.remaining.size === 0) this.onComplete.resolve(this.results.value);
  }

  private handleTimeout() {
    for (const relay of this.remaining) {
      this.handleResult(this.event.id, false, "Timeout", relay);
    }
  }
}
