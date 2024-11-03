import { nanoid } from "nanoid";
import { NostrEvent } from "nostr-tools";
import { AbstractRelay } from "nostr-tools/abstract-relay";

import relayPoolService from "../services/relay-pool";
import createDefer from "./deferred";
import ControlledObservable from "./controlled-observable";
import { BehaviorSubject } from "rxjs";

export type PublishResult = { relay: AbstractRelay; success: boolean; message: string };

export default class PublishAction {
  id = nanoid(8);
  label: string;
  relays: string[];
  event: NostrEvent;

  results = new BehaviorSubject<PublishResult[]>([]);
  completePromise = createDefer();

  /** @deprecated */
  onResult = new ControlledObservable<PublishResult>();

  private remaining = new Set<AbstractRelay>();

  constructor(label: string, relays: Iterable<string>, event: NostrEvent, timeout: number = 10_000) {
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
    const result: PublishResult = { relay, success, message };
    this.results.next([...this.results.value.filter((r) => r.relay !== relay), result]);
    this.onResult.next(result);

    this.remaining.delete(relay);

    if (this.remaining.size === 0) {
      this.completePromise.resolve();
    }
  }

  private handleTimeout() {
    for (const relay of this.remaining) {
      this.handleResult(this.event.id, false, "Timeout", relay);
    }
  }
}
