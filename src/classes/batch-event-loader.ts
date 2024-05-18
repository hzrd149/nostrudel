import { NostrEvent, AbstractRelay } from "nostr-tools";
import _throttle from "lodash.throttle";
import debug, { Debugger } from "debug";

import EventStore from "./event-store";
import PersistentSubscription from "./persistent-subscription";
import Process from "./process";
import BracketsX from "../components/icons/brackets-x";
import processManager from "../services/process-manager";
import createDefer, { Deferred } from "./deferred";

/** This class is used to batch requests for single events from a relay */
export default class BatchEventLoader {
  events = new EventStore();
  relay: AbstractRelay;
  process: Process;

  subscription: PersistentSubscription;

  // a map of events that are waiting for the current request to finish
  private next = new Map<string, Deferred<NostrEvent | null>>();

  // a map of events currently being requested from the relay
  private pending = new Map<string, Deferred<NostrEvent | null>>();

  log: Debugger;

  constructor(relay: AbstractRelay, log?: Debugger) {
    this.relay = relay;
    this.log = log || debug("BatchEventLoader");
    this.process = new Process("BatchEventLoader", this, [relay]);
    this.process.icon = BracketsX;
    processManager.registerProcess(this.process);

    this.subscription = new PersistentSubscription(this.relay, {
      onevent: (event) => this.handleEvent(event),
      oneose: () => this.handleEOSE(),
    });
    this.process.addChild(this.subscription.process);
  }

  requestEvent(id: string): Promise<NostrEvent | null> {
    const event = this.events.getEvent(id);

    if (!event) {
      if (this.pending.has(id)) return this.pending.get(id)!;
      if (this.next.has(id)) return this.next.get(id)!;

      const defer = createDefer<NostrEvent | null>();
      this.next.set(id, defer);

      // request subscription update
      this.start();

      return defer;
    }

    return Promise.resolve(event);
  }

  start = _throttle(
    () => {
      // don't do anything if the subscription is already running
      if (this.process.active) return;

      this.process.active = true;
      this.update();
    },
    500,
    { leading: false, trailing: true },
  );

  private handleEvent(event: NostrEvent) {
    const key = event.id;

    this.events.addEvent(event);
    this.pending.get(key)?.resolve(event);
    this.pending.delete(key);
  }
  private handleEOSE() {
    // resolve with null for any events we where not able to find
    for (const [key, defer] of this.pending) defer.resolve(null);

    // reset
    this.pending.clear();
    this.process.active = false;

    // do next request or close the subscription
    this.start();
  }

  update() {
    // copy everything from next to pending
    for (const [key, defer] of this.next) this.pending.set(key, defer);
    this.next.clear();

    // update subscription
    if (this.pending.size > 0) {
      this.log(`Updating filters ${this.pending.size} events`);

      this.subscription.filters = [{ ids: Array.from(this.pending.keys()) }];
      this.subscription.update();
      this.process.active = true;
    } else {
      this.log("Closing");
      this.subscription.close();
      this.process.active = false;
    }
  }

  destroy() {
    this.subscription.destroy();
    this.process.remove();
    processManager.unregisterProcess(this.process);
  }
}
