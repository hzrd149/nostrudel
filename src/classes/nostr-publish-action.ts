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

  results = new PersistentSubject<{ relay: Relay; result: IncomingCommandResult }[]>([]);

  onResult = new ControlledObservable<{ relay: Relay; result: IncomingCommandResult }>();
  onComplete = createDefer<{ relay: Relay; result: IncomingCommandResult }[]>();

  private remaining = new Set<Relay>();
  private relayResultSubs = new SuperMap<Relay, ZenObservable.Subscription[]>(() => []);

  constructor(label: string, relays: Iterable<string>, event: NostrEvent, timeout: number = 5000) {
    this.label = label;
    this.relays = Array.from(relays);
    this.event = event;

    for (const url of relays) {
      const relay = relayPoolService.requestRelay(url);
      this.remaining.add(relay);
      this.relayResultSubs.get(relay).push(
        relay.onCommandResult.subscribe((result) => {
          if (result[1] === this.event.id) this.handleResult(result, relay);
        }),
      );

      relay.send(["EVENT", event]);
    }

    setTimeout(this.handleTimeout.bind(this), timeout);
  }

  private handleResult(result: IncomingCommandResult, relay: Relay) {
    this.results.next([...this.results.value, { relay, result }]);
    this.onResult.next({ relay, result });

    this.relayResultSubs.get(relay).forEach((s) => s.unsubscribe());
    this.relayResultSubs.delete(relay);
    this.remaining.delete(relay);
    if (this.remaining.size === 0) this.onComplete.resolve(this.results.value);
  }

  private handleTimeout() {
    for (const relay of this.remaining) {
      this.handleResult(["OK", this.event.id, false, "Timeout"], relay);
    }
  }
}
