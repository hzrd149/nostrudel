import { nanoid } from "nanoid";

import { NostrEvent } from "../types/nostr-event";
import { RelayQueryMap } from "../types/nostr-relay";
import relayPoolService from "../services/relay-pool";
import { isFilterEqual, isQueryMapEqual } from "../helpers/nostr/filter";
import ControlledObservable from "./controlled-observable";
import { Relay, Subscription } from "nostr-tools";

export default class NostrMultiSubscription {
  static INIT = "initial";
  static OPEN = "open";
  static CLOSED = "closed";

  id: string;
  name?: string;
  queryMap: RelayQueryMap = {};

  relays: Relay[] = [];
  subscriptions = new Map<Relay, Subscription>();

  state = NostrMultiSubscription.INIT;
  onEvent = new ControlledObservable<NostrEvent>();
  seenEvents = new Set<string>();

  constructor(name?: string) {
    this.id = nanoid();
    this.name = name;
  }
  private handleEvent(event: NostrEvent) {
    if (this.seenEvents.has(event.id)) return;
    this.onEvent.next(event);
    this.seenEvents.add(event.id);
  }

  private handleAddRelay(relay: Relay) {
    relayPoolService.addClaim(relay.url, this);
  }
  private handleRemoveRelay(relay: Relay) {
    relayPoolService.removeClaim(relay.url, this);
  }

  setQueryMap(queryMap: RelayQueryMap) {
    if (isQueryMapEqual(this.queryMap, queryMap)) return;

    // add and remove relays
    for (const url of Object.keys(queryMap)) {
      if (!this.queryMap[url]) {
        if (this.relays.some((r) => r.url === url)) continue;
        // add relay
        const relay = relayPoolService.requestRelay(url);
        this.relays.push(relay);
        this.handleAddRelay(relay);
      }
    }
    for (const url of Object.keys(this.queryMap)) {
      if (!queryMap[url]) {
        const relay = this.relays.find((r) => r.url === url);
        if (!relay) continue;
        this.relays = this.relays.filter((r) => r !== relay);
        this.handleRemoveRelay(relay);
      }
    }

    this.queryMap = queryMap;

    this.updateSubscriptions();
  }

  private updateSubscriptions() {
    // close all subscriptions if not open
    if (this.state !== NostrMultiSubscription.OPEN) {
      for (const [relay, subscription] of this.subscriptions) {
        subscription.close();
      }
      this.subscriptions.clear();
      return;
    }

    // else open and update subscriptions
    for (const relay of this.relays) {
      const filters = this.queryMap[relay.url];

      let subscription = this.subscriptions.get(relay);
      if (!subscription || !isFilterEqual(subscription.filters, filters)) {
        if (subscription) {
          subscription.filters = filters;
          subscription.fire();
        } else {
          subscription = relay.subscribe(filters, {
            onevent: (event) => this.handleEvent(event),
            onclose: () => {
              if (this.subscriptions.get(relay) === subscription) {
                this.subscriptions.delete(relay);
              }
            },
          });
          this.subscriptions.set(relay, subscription);
        }
      }
    }
  }

  publish(event: NostrEvent) {
    return Promise.all(this.relays.map((r) => r.publish(event)));
  }

  open() {
    if (this.state === NostrMultiSubscription.OPEN) return this;

    this.state = NostrMultiSubscription.OPEN;
    // reconnect to all relays
    for (const relay of this.relays) this.handleAddRelay(relay);
    // send queries
    this.updateSubscriptions();

    return this;
  }
  waitForAllConnection(): Promise<void> {
    return Promise.all(this.relays.filter((r) => !r.connected).map((r) => r.connect())).then((v) => void 0);
  }
  close() {
    if (this.state !== NostrMultiSubscription.OPEN) return this;

    // forget all seen events
    this.forgetEvents();
    // unsubscribe from relay messages
    for (const relay of this.relays) this.handleRemoveRelay(relay);
    // set state
    this.state = NostrMultiSubscription.CLOSED;

    return this;
  }
  forgetEvents() {
    // forget all seen events
    this.seenEvents.clear();
  }
}
