import { nanoid } from "nanoid";
import { Subject } from "./subject";
import { NostrEvent } from "../types/nostr-event";
import { NostrOutgoingMessage, NostrOutgoingRequest, NostrRequestFilter } from "../types/nostr-query";
import Relay, { IncomingEvent } from "./relay";
import relayPoolService from "../services/relay-pool";

export default class NostrMultiSubscription {
  static INIT = "initial";
  static OPEN = "open";
  static CLOSED = "closed";

  id: string;
  name?: string;
  query?: NostrRequestFilter;
  relayUrls: string[];
  relays: Relay[];
  state = NostrMultiSubscription.INIT;
  onEvent = new Subject<NostrEvent>();
  seenEvents = new Set<string>();

  constructor(relayUrls: string[], query?: NostrRequestFilter, name?: string) {
    this.id = nanoid();
    this.query = query;
    this.name = name;
    this.relayUrls = relayUrls;

    this.relays = this.relayUrls.map((url) => relayPoolService.requestRelay(url));
  }
  private handleEvent(event: IncomingEvent) {
    if (this.state === NostrMultiSubscription.OPEN && event.subId === this.id && !this.seenEvents.has(event.body.id)) {
      this.onEvent.next(event.body);
      this.seenEvents.add(event.body.id);
    }
  }

  private relayQueries = new WeakMap<Relay, NostrRequestFilter>();
  private updateRelayQueries() {
    if (!this.query || this.state !== NostrMultiSubscription.OPEN) return;

    const message: NostrOutgoingRequest = Array.isArray(this.query)
      ? ["REQ", this.id, ...this.query]
      : ["REQ", this.id, this.query];

    for (const relay of this.relays) {
      if (this.relayQueries.get(relay) !== this.query) {
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
  sendToAll(message: NostrOutgoingMessage) {
    for (const relay of this.relays) {
      relay.send(message);
    }
  }

  /** listen for event and open events from relays */
  private connectToRelays() {
    for (const relay of this.relays) {
      relay.onEvent.subscribe(this.handleEvent, this);
      relay.onOpen.subscribe(this.handleRelayConnect, this);
      relay.onClose.subscribe(this.handleRelayDisconnect, this);
      relayPoolService.addClaim(relay.url, this);
    }
  }
  /** stop listing to events from relays */
  private disconnectFromRelays() {
    for (const relay of this.relays) {
      relay.onEvent.unsubscribe(this.handleEvent, this);
      relay.onOpen.unsubscribe(this.handleRelayConnect, this);
      relay.onClose.unsubscribe(this.handleRelayDisconnect, this);
      relayPoolService.removeClaim(relay.url, this);
    }
  }

  open() {
    if (!this.query) throw new Error("Cant open without a query");
    if (this.state === NostrMultiSubscription.OPEN) return this;

    this.state = NostrMultiSubscription.OPEN;
    this.connectToRelays();
    this.updateRelayQueries();

    return this;
  }
  setQuery(query: NostrRequestFilter) {
    this.query = query;
    this.updateRelayQueries();
    return this;
  }
  setRelays(relayUrls: string[]) {
    this.disconnectFromRelays();
    const newRelays = relayUrls.map((url) => relayPoolService.requestRelay(url));

    for (const relay of this.relays) {
      if (!newRelays.includes(relay)) {
        // if the subscription is open and the relay is connected
        if (this.state === NostrMultiSubscription.OPEN && relay.connected) {
          // close the connection to this relay
          relay.send(["CLOSE", this.id]);
        }
      }
    }

    // set new relays
    this.relayUrls = relayUrls;
    this.relays = newRelays;

    if (this.state === NostrMultiSubscription.OPEN) {
      this.connectToRelays();
      this.updateRelayQueries();
    }
  }
  close() {
    if (this.state !== NostrMultiSubscription.OPEN) return this;

    // set state
    this.state = NostrMultiSubscription.CLOSED;
    // send close message
    this.sendToAll(["CLOSE", this.id]);
    // forget all seen events
    this.seenEvents.clear();
    // unsubscribe from relay messages
    this.disconnectFromRelays();

    return this;
  }
  forgetEvents() {
    // forget all seen events
    this.seenEvents.clear();
  }
}
