import { nanoid } from "nanoid";
import { NostrEvent } from "nostr-tools";

import relayPoolService from "../services/relay-pool";
import createDefer from "./deferred";
import Relay, { IncomingCommandResult } from "./relay";
import { PersistentSubject } from "./subject";
import ControlledObservable from "./controlled-observable";
import SuperMap from "./super-map";

export default class NostrPublishAction {
  id = nanoid();
  label: string;
  relays: string[];
  event: NostrEvent;

  results = new PersistentSubject<IncomingCommandResult[]>([]);
  onResult = new ControlledObservable<IncomingCommandResult>();
  onComplete = createDefer<IncomingCommandResult[]>();

  private remaining = new Set<Relay>();
  private relayResultSubs = new SuperMap<Relay, ZenObservable.Subscription[]>(() => []);

  constructor(label: string, relays: Iterable<string>, event: NostrEvent, timeout: number = 5000) {
    this.label = label;
    this.relays = Array.from(relays);
    this.event = event;

    for (const url of relays) {
      const relay = relayPoolService.requestRelay(url);
      this.remaining.add(relay);
      this.relayResultSubs.get(relay).push(relay.onCommandResult.subscribe(this.handleResult.bind(this)));

      // send event
      relay.send(["EVENT", event]);
    }

    setTimeout(this.handleTimeout.bind(this), timeout);
  }

  private handleResult(result: IncomingCommandResult) {
    if (result.eventId === this.event.id) {
      const relay = result.relay;
      this.results.next([...this.results.value, result]);

      this.onResult.next(result);

      this.relayResultSubs.get(relay).forEach((s) => s.unsubscribe());
      this.relayResultSubs.delete(relay);
      this.remaining.delete(relay);
      if (this.remaining.size === 0) this.onComplete.resolve(this.results.value);
    }
  }

  private handleTimeout() {
    for (const relay of this.remaining) {
      this.handleResult({
        message: "Timeout",
        eventId: this.event.id,
        status: false,
        type: "OK",
        relay,
      });
    }
  }
}
