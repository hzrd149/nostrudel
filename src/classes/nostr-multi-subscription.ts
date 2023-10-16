import { nanoid } from "nanoid";
import { Subject } from "./subject";
import { NostrEvent } from "../types/nostr-event";
import { NostrOutgoingMessage, NostrRequestFilter } from "../types/nostr-query";
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

    this.relays = relayUrls.map((url) => relayPoolService.requestRelay(url));
  }
  private handleEvent(event: IncomingEvent) {
    if (this.state === NostrMultiSubscription.OPEN && event.subId === this.id && !this.seenEvents.has(event.body.id)) {
      this.onEvent.next(event.body);
      this.seenEvents.add(event.body.id);
    }
  }
  send(message: NostrOutgoingMessage) {
    for (const relay of this.relays) {
      relay.send(message);
    }
  }

  /** listen for event and open events from relays */
  private subscribeToRelays() {
    for (const relay of this.relays) {
      relay.onEvent.subscribe(this.handleEvent, this);
    }

    for (const url of this.relayUrls) {
      relayPoolService.addClaim(url, this);
    }
  }
  /** listen for event and open events from relays */
  private unsubscribeFromRelays() {
    for (const relay of this.relays) {
      relay.onEvent.unsubscribe(this.handleEvent, this);
    }

    for (const url of this.relayUrls) {
      relayPoolService.removeClaim(url, this);
    }
  }

  open() {
    if (!this.query) throw new Error("cant open without a query");
    if (this.state === NostrMultiSubscription.OPEN) return this;

    this.state = NostrMultiSubscription.OPEN;
    if (Array.isArray(this.query)) {
      this.send(["REQ", this.id, ...this.query]);
    } else this.send(["REQ", this.id, this.query]);

    this.subscribeToRelays();

    return this;
  }
  setQuery(query: NostrRequestFilter) {
    this.query = query;
    if (this.state === NostrMultiSubscription.OPEN) {
      if (Array.isArray(this.query)) {
        this.send(["REQ", this.id, ...this.query]);
      } else this.send(["REQ", this.id, this.query]);
    }
    return this;
  }
  setRelays(relays: string[]) {
    this.unsubscribeFromRelays();
    const newRelays = relays.map((url) => relayPoolService.requestRelay(url));

    for (const relay of this.relays) {
      if (!newRelays.includes(relay)) {
        // if the subscription is open and the relay is connected
        if (this.state === NostrMultiSubscription.OPEN && relay.connected) {
          // close the connection to this relay
          relay.send(["CLOSE", this.id]);
        }
      }
    }
    for (const relay of newRelays) {
      if (!this.relays.includes(relay)) {
        // if the subscription is open and it has a query
        if (this.state === NostrMultiSubscription.OPEN && this.query) {
          // open a connection to this relay
          if (Array.isArray(this.query)) {
            relay.send(["REQ", this.id, ...this.query]);
          } else relay.send(["REQ", this.id, this.query]);
        }
      }
    }

    // set new relays
    this.relayUrls = relays;
    this.relays = newRelays;

    if (this.state === NostrMultiSubscription.OPEN) {
      this.subscribeToRelays();
    }
  }
  close() {
    if (this.state !== NostrMultiSubscription.OPEN) return this;

    // set state
    this.state = NostrMultiSubscription.CLOSED;
    // send close message
    this.send(["CLOSE", this.id]);
    // forget all seen events
    this.seenEvents.clear();
    // unsubscribe from relay messages
    this.unsubscribeFromRelays();

    return this;
  }
  forgetEvents() {
    // forget all seen events
    this.seenEvents.clear();
  }
}
