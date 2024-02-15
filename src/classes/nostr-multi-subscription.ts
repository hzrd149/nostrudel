import { nanoid } from "nanoid";

import { NostrEvent } from "../types/nostr-event";
import { NostrOutgoingRequest, NostrRequestFilter, RelayQueryMap } from "../types/nostr-query";
import Relay, { IncomingEvent } from "./relay";
import relayPoolService from "../services/relay-pool";
import { isFilterEqual, isQueryMapEqual } from "../helpers/nostr/filter";
import ControlledObservable from "./controlled-observable";
import SuperMap from "./super-map";

export default class NostrMultiSubscription {
  static INIT = "initial";
  static OPEN = "open";
  static CLOSED = "closed";

  id: string;
  name?: string;
  queryMap: RelayQueryMap = {};

  relays: Relay[] = [];
  state = NostrMultiSubscription.INIT;
  onEvent = new ControlledObservable<NostrEvent>();
  seenEvents = new Set<string>();

  constructor(name?: string) {
    this.id = nanoid();
    this.name = name;
  }
  private handleEvent(incomingEvent: IncomingEvent) {
    if (
      this.state === NostrMultiSubscription.OPEN &&
      incomingEvent.subId === this.id &&
      !this.seenEvents.has(incomingEvent.body.id)
    ) {
      this.onEvent.next(incomingEvent.body);
      this.seenEvents.add(incomingEvent.body.id);
    }
  }

  private relaySubs = new SuperMap<Relay, ZenObservable.Subscription[]>(() => []);
  /** listen for event and open events from relays */
  private connectToRelay(relay: Relay) {
    const subs = this.relaySubs.get(relay);
    subs.push(relay.onEvent.subscribe(this.handleEvent.bind(this)));
    subs.push(relay.onOpen.subscribe(this.handleRelayConnect.bind(this)));
    subs.push(relay.onClose.subscribe(this.handleRelayDisconnect.bind(this)));
    relayPoolService.addClaim(relay.url, this);
  }
  /** stop listing to events from relays */
  private disconnectFromRelay(relay: Relay) {
    const subs = this.relaySubs.get(relay);
    for (const sub of subs) sub.unsubscribe();
    this.relaySubs.delete(relay);
    relayPoolService.removeClaim(relay.url, this);

    // if the subscription is open and had sent a request to the relay
    if (this.state === NostrMultiSubscription.OPEN && this.relayQueries.has(relay)) {
      relay.send(["CLOSE", this.id]);
    }
    this.relayQueries.delete(relay);
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
        this.connectToRelay(relay);
      }
    }
    for (const url of Object.keys(this.queryMap)) {
      if (!queryMap[url]) {
        const relay = this.relays.find((r) => r.url === url);
        if (!relay) continue;
        this.relays = this.relays.filter((r) => r !== relay);
        this.disconnectFromRelay(relay);
      }
    }

    this.queryMap = queryMap;

    this.updateRelayQueries();
  }

  private relayQueries = new WeakMap<Relay, NostrRequestFilter>();
  private updateRelayQueries() {
    if (this.state !== NostrMultiSubscription.OPEN) return;

    for (const relay of this.relays) {
      const filter = this.queryMap[relay.url];
      const message: NostrOutgoingRequest = Array.isArray(filter)
        ? ["REQ", this.id, ...filter]
        : ["REQ", this.id, filter];

      const currentFilter = this.relayQueries.get(relay);
      if (!currentFilter || !isFilterEqual(currentFilter, filter)) {
        this.relayQueries.set(relay, filter);
        relay.send(message);
      }
    }
  }
  private handleRelayConnect(relay: Relay) {
    this.updateRelayQueries();
  }
  private handleRelayDisconnect(relay: Relay) {
    this.relayQueries.delete(relay);
  }

  sendAll(event: NostrEvent) {
    for (const relay of this.relays) {
      relay.send(["EVENT", event]);
    }
  }

  open() {
    if (this.state === NostrMultiSubscription.OPEN) return this;

    this.state = NostrMultiSubscription.OPEN;
    // reconnect to all relays
    for (const relay of this.relays) this.connectToRelay(relay);
    // send queries
    this.updateRelayQueries();

    return this;
  }
  waitForConnection(): Promise<void> {
    return Promise.all(this.relays.map((r) => r.waitForConnection())).then((v) => void 0);
  }
  close() {
    if (this.state !== NostrMultiSubscription.OPEN) return this;

    // forget all seen events
    this.forgetEvents();
    // unsubscribe from relay messages
    for (const relay of this.relays) this.disconnectFromRelay(relay);
    // set state
    this.state = NostrMultiSubscription.CLOSED;

    return this;
  }
  forgetEvents() {
    // forget all seen events
    this.seenEvents.clear();
  }
}
