import { NostrEvent } from "nostr-tools";
import { AbstractRelay } from "nostr-tools/abstract-relay";
import _throttle from "lodash.throttle";
import debug, { Debugger } from "debug";
import { EventStore } from "applesauce-core";
import { getEventUID } from "applesauce-core/helpers";
import { createDefer, Deferred } from "applesauce-core/promise";
import { Subject } from "rxjs";

import PersistentSubscription from "./persistent-subscription";
import SuperMap from "./super-map";

/** Batches requests for events with #d tags from a single relay */
export default class BatchIdentifierLoader {
  store: EventStore;
  kinds: number[];
  relay: AbstractRelay;

  /** list of identifiers that have been loaded */
  requested = new Set<string>();
  /** identifier -> event uid -> event */
  identifiers = new SuperMap<string, Map<string, NostrEvent>>(() => new Map());

  onIdentifierUpdate = new Subject<string>();

  subscription: PersistentSubscription;

  // a map of identifiers that are waiting for the current request to finish
  private next = new Map<string, Deferred<Map<string, NostrEvent>>>();

  // a map of identifiers currently being requested from the relay
  private pending = new Map<string, Deferred<Map<string, NostrEvent>>>();

  log: Debugger;

  active = false;
  constructor(store: EventStore, relay: AbstractRelay, kinds: number[], log?: Debugger) {
    this.store = store;
    this.relay = relay;
    this.kinds = kinds;
    this.log = log || debug("BatchIdentifierLoader");

    this.subscription = new PersistentSubscription(this.relay, {
      onevent: (event) => this.handleEvent(event),
      oneose: () => this.handleEOSE(),
    });
  }

  requestEvents(identifier: string): Promise<Map<string, NostrEvent>> {
    // if there is a cache only return it if we have requested this id before
    if (this.identifiers.has(identifier) && this.requested.has(identifier)) {
      return Promise.resolve(this.identifiers.get(identifier));
    }

    if (this.pending.has(identifier)) return this.pending.get(identifier)!;
    if (this.next.has(identifier)) return this.next.get(identifier)!;

    const defer = createDefer<Map<string, NostrEvent>>();
    this.next.set(identifier, defer);

    // request subscription update
    this.requestUpdate();

    return defer;
  }

  requestUpdate = _throttle(
    () => {
      // don't do anything if the subscription is already running
      if (this.active) return;

      this.active = true;
      this.update();
    },
    500,
    { leading: false, trailing: true },
  );

  handleEvent(event: NostrEvent) {
    event = this.store.add(event, this.relay.url);

    // add event to cache
    for (const tag of event.tags) {
      if (tag[0] === "d" && tag[1]) {
        const identifier = tag[1];
        this.identifiers.get(identifier).set(getEventUID(event), event);
        this.changedIdentifiers.add(identifier);
      }
    }
  }

  private changedIdentifiers = new Set<string>();
  handleEOSE() {
    // resolve all pending from the last request
    for (const [identifier, defer] of this.pending) {
      defer.resolve(this.identifiers.get(identifier));
      this.changedIdentifiers.add(identifier);
    }

    // reset
    this.pending.clear();
    this.active = false;

    for (const identifier of this.changedIdentifiers) {
      this.onIdentifierUpdate.next(identifier);
    }

    // do next request or close the subscription
    if (this.next.size > 0) this.requestUpdate();
  }

  async update() {
    // copy everything from next to pending
    for (const [identifier, defer] of this.next) this.pending.set(identifier, defer);
    this.next.clear();

    // update subscription
    if (this.pending.size > 0) {
      this.log(`Updating filters ${this.pending.size} events`);

      const dTags: string[] = [];
      const identifiers = Array.from(this.pending.keys());
      for (const identifier of identifiers) {
        this.requested.add(identifier);
        dTags.push(identifier);
      }

      try {
        this.active = true;
        this.subscription.filters = [];
        if (dTags.length > 0) this.subscription.filters.push({ "#d": dTags, kinds: this.kinds });

        await this.subscription.update();
      } catch (error) {
        if (error instanceof Error) this.log(`Failed to update subscription`, error.message);
        this.active = false;
      }
    } else {
      this.log("Closing");
      this.subscription.close();
      this.active = false;
    }
  }

  destroy() {
    this.subscription.destroy();
  }
}
