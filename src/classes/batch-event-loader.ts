import { NostrEvent } from "nostr-tools";
import { AbstractRelay } from "nostr-tools/abstract-relay";
import _throttle from "lodash.throttle";
import { EventStore } from "applesauce-core";
import debug, { Debugger } from "debug";

import PersistentSubscription from "./persistent-subscription";
import Process from "./process";
import BracketsX from "../components/icons/brackets-x";
import processManager from "../services/process-manager";
import createDefer, { Deferred } from "./deferred";

/** This class is used to batch requests for single events from a relay */
export default class BatchEventLoader {
  relay: AbstractRelay;
  process: Process;
  store: EventStore;

  subscription: PersistentSubscription;

  // a map of events that are waiting for the current request to finish
  private next = new Map<string, Deferred<NostrEvent | null>>();

  // a map of events currently being requested from the relay
  private pending = new Map<string, Deferred<NostrEvent | null>>();

  log: Debugger;

  constructor(store: EventStore, relay: AbstractRelay, log?: Debugger) {
    this.relay = relay;
    this.store = store;
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

  requestEvent(uid: string): Promise<NostrEvent | null> {
    const event = this.store.getEvent(uid);

    if (!event) {
      if (this.pending.has(uid)) return this.pending.get(uid)!;
      if (this.next.has(uid)) return this.next.get(uid)!;

      const defer = createDefer<NostrEvent | null>();
      this.next.set(uid, defer);

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
    event = this.store.add(event, this.relay.url);

    const key = event.id;

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

  async update() {
    // copy everything from next to pending
    for (const [key, defer] of this.next) this.pending.set(key, defer);
    this.next.clear();

    // update subscription
    if (this.pending.size > 0) {
      this.log(`Updating filters ${this.pending.size} events`);

      try {
        this.process.active = true;
        this.subscription.filters = [{ ids: Array.from(this.pending.keys()) }];
        await this.subscription.update();
      } catch (error) {
        if (error instanceof Error) this.log(`Failed to update subscription`, error.message);
        this.process.active = false;
      }
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
