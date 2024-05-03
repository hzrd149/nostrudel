import dayjs from "dayjs";
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

const RELAY_REQUEST_BATCH_TIME = 500;

/** This class is ued to batch requests by kind to a single relay */
export default class BatchKindLoader {
  private subscription: PersistentSubscription | null = null;
  events = new EventStore();
  relay: AbstractRelay;
  process: Process;

  private requestNext = new Set<string>();

  private requested = new Map<string, Date>();
  private promises = new Map<string, Deferred<NostrEvent | null>>();

  log: Debugger;

  constructor(relay: AbstractRelay, log?: Debugger) {
    this.relay = relay;
    this.log = log || debug("BatchKindLoader");
    this.process = new Process("BatchKindLoader", this, [relay]);
    this.process.icon = BracketsX;
    processManager.registerProcess(this.process);
  }

  private handleEvent(event: NostrEvent) {
    const key = getEventUID(event);

    // remove the key from the waiting list
    this.requested.delete(key);

    const defer = this.promises.get(key);
    if (defer) this.promises.delete(key);

    const current = this.events.getEvent(key);
    if (!current || event.created_at > current.created_at) {
      this.events.addEvent(event);

      if (defer) defer.resolve(event);
    } else if (defer) defer.resolve(null);
  }
  private handleEOSE() {
    for (const [key, defer] of this.promises) {
      this.requested.delete(key);
      defer.resolve(null);
    }
    this.promises.clear();
  }

  requestEvent(kind: number, pubkey: string, d?: string): Promise<NostrEvent | null> {
    const key = createCoordinate(kind, pubkey, d);
    const event = this.events.getEvent(key);

    if (!event) {
      if (this.promises.has(key)) return this.promises.get(key)!;

      const p = createDefer<NostrEvent | null>();
      this.promises.set(key, p);

      this.requestNext.add(key);
      this.updateThrottle();

      return p;
    }

    return Promise.resolve(event);
  }

  updateThrottle = _throttle(this.update, RELAY_REQUEST_BATCH_TIME);
  async update() {
    // skip the update if the subscription is running
    if (this.subscription?.closed === false && !this.subscription.eosed) return;

    let needsUpdate = false;
    for (const key of this.requestNext) {
      if (!this.requested.has(key)) {
        this.requested.set(key, new Date());
        needsUpdate = true;
      }
    }
    this.requestNext.clear();

    // update the subscription
    if (needsUpdate) {
      if (this.requested.size > 0) {
        const filters: Record<number, Filter> = {};

        for (const [cord] of this.requested) {
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

        const query = Array.from(Object.values(filters));

        this.log(
          `Updating query`,
          Array.from(Object.keys(filters))
            .map((kind: string) => `kind ${kind}: ${filters[parseInt(kind)].authors?.length}`)
            .join(", "),
        );

        if (!this.subscription) {
          this.subscription = new PersistentSubscription(this.relay, {
            onevent: (event) => this.handleEvent(event),
            oneose: () => this.handleEOSE(),
          });
          this.process.addChild(this.subscription.process);
        }

        this.subscription.filters = query;
        this.subscription.update();
        this.process.active = true;
      } else if (this.subscription) {
        this.subscription.close();
        this.process.active = false;
      }
    }
  }

  destroy() {
    this.process.remove();
    processManager.unregisterProcess(this.process);
  }
}
