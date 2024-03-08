import dayjs from "dayjs";
import { Filter, NostrEvent } from "nostr-tools";
import _throttle from "lodash.throttle";
import debug, { Debugger } from "debug";

import NostrSubscription from "./nostr-subscription";
import EventStore from "./event-store";
import { getEventCoordinate } from "../helpers/nostr/event";

export function createCoordinate(kind: number, pubkey: string, d?: string) {
  return `${kind}:${pubkey}${d ? ":" + d : ""}`;
}

const RELAY_REQUEST_BATCH_TIME = 500;

/** This class is ued to batch requests by kind to a single relay */
export default class BatchKindLoader {
  private subscription: NostrSubscription;
  events = new EventStore();

  private requestNext = new Set<string>();
  private requested = new Map<string, Date>();

  log: Debugger;

  constructor(relay: string, log?: Debugger) {
    this.subscription = new NostrSubscription(relay, undefined, `replaceable-event-loader`);

    this.subscription.onEvent.subscribe(this.handleEvent.bind(this));
    this.subscription.onEOSE.subscribe(this.handleEOSE.bind(this));

    this.log = log || debug("RelayBatchLoader");
  }

  private handleEvent(event: NostrEvent) {
    const key = getEventCoordinate(event);

    // remove the key from the waiting list
    this.requested.delete(key);

    const current = this.events.getEvent(key);
    if (!current || event.created_at > current.created_at) {
      this.events.addEvent(event);
    }
  }
  private handleEOSE() {
    // relays says it has nothing left
    this.requested.clear();
  }

  requestEvent(kind: number, pubkey: string, d?: string) {
    const key = createCoordinate(kind, pubkey, d);
    const event = this.events.getEvent(key);
    if (!event) {
      this.requestNext.add(key);
      this.updateThrottle();
    }
    return event;
  }

  updateThrottle = _throttle(this.update, RELAY_REQUEST_BATCH_TIME);
  update() {
    let needsUpdate = false;
    for (const key of this.requestNext) {
      if (!this.requested.has(key)) {
        this.requested.set(key, new Date());
        needsUpdate = true;
      }
    }
    this.requestNext.clear();

    // prune requests
    const timeout = dayjs().subtract(1, "minute");
    for (const [key, date] of this.requested) {
      if (dayjs(date).isBefore(timeout)) {
        this.requested.delete(key);
        needsUpdate = true;
      }
    }

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
        this.subscription.setFilters(query);

        if (this.subscription.state !== NostrSubscription.OPEN) {
          this.subscription.open();
        }
      } else if (this.subscription.state === NostrSubscription.OPEN) {
        this.subscription.close();
      }
    }
  }
}
