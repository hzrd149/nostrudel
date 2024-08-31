import { nanoid } from "nanoid";
import { Filter } from "nostr-tools";
import { AbstractRelay } from "nostr-tools/abstract-relay";

import { NostrEvent } from "../types/nostr-event";
import relayPoolService from "../services/relay-pool";
import { isFilterEqual } from "../helpers/nostr/filter";
import ControlledObservable from "./controlled-observable";
import { offlineMode } from "../services/offline-mode";
import PersistentSubscription from "./persistent-subscription";
import Process from "./process";
import Dataflow01 from "../components/icons/dataflow-01";
import processManager from "../services/process-manager";
import { localRelay } from "../services/local-relay";

export default class MultiSubscription {
  static OPEN = "open";
  static CLOSED = "closed";

  id: string;
  name: string;
  process: Process;
  filters: Filter[] = [];

  relays = new Set<AbstractRelay>();
  subscriptions = new Map<AbstractRelay, PersistentSubscription>();

  useCache = true;
  cacheSubscription: PersistentSubscription | null = null;
  onCacheEvent = new ControlledObservable<NostrEvent>();

  state = MultiSubscription.CLOSED;
  onEvent = new ControlledObservable<NostrEvent>();
  seenEvents = new Set<string>();

  constructor(name: string) {
    this.id = nanoid(8);
    this.name = name;
    this.process = new Process("MultiSubscription", this);
    this.process.name = this.name;
    this.process.icon = Dataflow01;

    processManager.registerProcess(this.process);
  }
  private handleEvent(event: NostrEvent, fromCache = false) {
    if (this.seenEvents.has(event.id)) return;

    if (fromCache) this.onCacheEvent.next(event);
    else this.onEvent.next(event);

    this.seenEvents.add(event.id);
  }

  setFilters(filters: Filter[]) {
    if (isFilterEqual(this.filters, filters)) return;
    this.filters = filters;
    this.updateSubscriptions();
  }

  setRelays(relays: Iterable<string | URL | AbstractRelay>) {
    const newRelays = relayPoolService.getRelays(relays);

    // remove relays
    for (const relay of this.relays) {
      if (!newRelays.includes(relay)) {
        this.relays.delete(relay);
        const sub = this.subscriptions.get(relay);
        if (sub) {
          sub.destroy();
          this.subscriptions.delete(relay);
        }
      }
    }

    // add relays
    for (const relay of newRelays) {
      this.relays.add(relay);
    }

    this.updateSubscriptions();
  }

  private updateSubscriptions() {
    // close all subscriptions if not open
    if (this.state !== MultiSubscription.OPEN) {
      for (const [relay, subscription] of this.subscriptions) subscription.close();
      this.cacheSubscription?.close();
      return;
    }

    // else open and update subscriptions
    for (const relay of this.relays) {
      let subscription = this.subscriptions.get(relay);
      if (!subscription || !isFilterEqual(subscription.filters, this.filters) || subscription.closed) {
        if (!subscription) {
          subscription = new PersistentSubscription(relay, {
            onevent: (event) => this.handleEvent(event),
          });

          this.process.addChild(subscription.process);
          this.subscriptions.set(relay, subscription);
        }

        if (subscription) {
          subscription.filters = this.filters;
          subscription.update().catch((err) => {
            // eat error
          });
        }
      }
    }

    if (this.useCache) {
      // create cache sub if it does not exist
      if (!this.cacheSubscription && localRelay) {
        this.cacheSubscription = new PersistentSubscription(localRelay as AbstractRelay, {
          onevent: (event) => this.handleEvent(event, true),
        });
        this.process.addChild(this.cacheSubscription.process);
      }

      // update cache sub filters if they changed
      if (
        this.cacheSubscription &&
        (!isFilterEqual(this.cacheSubscription.filters, this.filters) || this.cacheSubscription.closed)
      ) {
        this.cacheSubscription.filters = this.filters;
        this.cacheSubscription.update().catch((err) => {
          // eat error
        });
      }
    } else if (this.cacheSubscription?.closed === false) {
      this.cacheSubscription.close();
    }
  }

  publish(event: NostrEvent) {
    return Promise.allSettled(
      Array.from(this.relays).map(async (r) => {
        if (!r.connected) await relayPoolService.requestConnect(r);
        return await r.publish(event);
      }),
    );
  }

  open() {
    if (this.state === MultiSubscription.OPEN) return this;

    this.state = MultiSubscription.OPEN;
    this.updateSubscriptions();
    this.process.active = true;

    return this;
  }
  waitForAllConnection(): Promise<void> {
    if (offlineMode.value) return Promise.resolve();
    return Promise.allSettled(
      Array.from(this.relays)
        .filter((r) => !r.connected)
        .map((r) => r.connect()),
    ).then((v) => void 0);
  }
  close() {
    if (this.state !== MultiSubscription.OPEN) return this;

    // forget all seen events
    this.forgetEvents();
    // unsubscribe from relay messages
    this.state = MultiSubscription.CLOSED;
    this.process.active = false;

    // close all
    this.updateSubscriptions();

    return this;
  }
  forgetEvents() {
    // forget all seen events
    this.seenEvents.clear();
  }

  destroy() {
    for (const [relay, sub] of this.subscriptions) {
      sub.destroy();
    }

    this.process.remove();
    processManager.unregisterProcess(this.process);
  }
}
