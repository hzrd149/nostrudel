import { Filter, NostrEvent, AbstractRelay } from "nostr-tools";
import _throttle from "lodash.throttle";
import debug, { Debugger } from "debug";

import EventStore from "./event-store";
import { getEventUID } from "../helpers/nostr/event";
import PersistentSubscription from "./persistent-subscription";
import Process from "./process";
import BracketsX from "../components/icons/brackets-x";
import processManager from "../services/process-manager";
import createDefer, { Deferred } from "./deferred";

export function createCoordinate(kind: number, pubkey: string, d?: string) {
  return `${kind}:${pubkey}${d ? ":" + d : ""}`;
}

/** This class is ued to batch requests by kind to a single relay */
export default class BatchKindLoader {
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
    this.log = log || debug("BatchKindLoader");
    this.process = new Process("BatchKindLoader", this, [relay]);
    this.process.icon = BracketsX;
    processManager.registerProcess(this.process);

    this.subscription = new PersistentSubscription(this.relay, {
      onevent: (event) => this.handleEvent(event),
      oneose: () => this.handleEOSE(),
    });
    this.process.addChild(this.subscription.process);
  }

  requestEvent(kind: number, pubkey: string, d?: string): Promise<NostrEvent | null> {
    const key = createCoordinate(kind, pubkey, d);
    const event = this.events.getEvent(key);

    if (!event) {
      if (this.pending.has(key)) return this.pending.get(key)!;
      if (this.next.has(key)) return this.next.get(key)!;

      const defer = createDefer<NostrEvent | null>();
      this.next.set(key, defer);

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
    const key = getEventUID(event);

    const defer = this.pending.get(key);
    if (defer) this.pending.delete(key);

    const current = this.events.getEvent(key);
    if (!current || event.created_at > current.created_at) {
      this.events.addEvent(event);

      if (defer) defer.resolve(event);
    } else if (defer) defer.resolve(null);
  }
  private handleEOSE() {
    // resolve with null for any events we where not able to find
    for (const [key, defer] of this.pending) defer.resolve(null);

    // reset
    this.pending.clear();
    this.process.active = false;

    // batch finished, if there is a next request an update
    if (this.next.size > 0) this.start();
  }

  update() {
    // copy everything from next to pending
    for (const [key, defer] of this.next) this.pending.set(key, defer);
    this.next.clear();

    // update subscription
    if (this.pending.size > 0) {
      const filters: Record<number, Filter> = {};

      for (const [cord] of this.pending) {
        const [kindStr, pubkey, d] = cord.split(":") as [string, string] | [string, string, string];
        const kind = parseInt(kindStr);
        filters[kind] = filters[kind] || { kinds: [kind] };

        const arr = (filters[kind].authors = filters[kind].authors || []);
        arr.push(pubkey);

        if (d) {
          const arr = (filters[kind]["#d"] = filters[kind]["#d"] || []);
          arr.push(d);
        }
      }

      this.log(
        `Updating query`,
        Array.from(Object.keys(filters))
          .map((kind: string) => `kind ${kind}: ${filters[parseInt(kind)].authors?.length}`)
          .join(", "),
      );

      this.subscription.filters = Array.from(Object.values(filters));
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
