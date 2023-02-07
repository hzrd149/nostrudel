import { Subject, SubscriptionLike } from "rxjs";
import { NostrEvent } from "../types/nostr-event";
import { NostrOutgoingMessage, NostrQuery } from "../types/nostr-query";
import { Relay } from "./relays";
import { IncomingEvent } from "./relays/relay";
import relayPool from "./relays/relay-pool";

export class Subscription {
  static OPEN = "open";
  static CLOSED = "closed";

  id: string;
  name?: string;
  query?: NostrQuery;
  relayUrls: string[];
  relays: Relay[];
  state = Subscription.CLOSED;
  onEvent = new Subject<NostrEvent>();
  cleanup: SubscriptionLike[] = [];

  constructor(relayUrls: string[], query?: NostrQuery, name?: string) {
    this.id = String(Math.floor(Math.random() * 1000000));
    this.query = query;
    this.name = name;
    this.relayUrls = relayUrls;

    this.relays = relayUrls.map((url) => relayPool.requestRelay(url));
  }
  handleOpen(relay: Relay) {
    if (!this.query) return;
    // when the relay connects send the req event
    relay.send(["REQ", this.id, this.query]);
  }
  handleEvent(event: IncomingEvent) {
    if (event.subId === this.id) {
      this.onEvent.next(event.body);
    }
  }
  send(message: NostrOutgoingMessage) {
    for (const relay of this.relays) {
      relay.send(message);
    }
  }

  setQuery(query: NostrQuery) {
    this.query = query;

    // if open, than update remote subscription
    if (this.state === Subscription.OPEN) {
      this.send(["REQ", this.id, this.query]);
    }
  }
  open() {
    if (this.state === Subscription.OPEN || !this.query) return;
    this.state = Subscription.OPEN;
    this.send(["REQ", this.id, this.query]);

    for (const relay of this.relays) {
      this.cleanup.push(relay.onEvent.subscribe(this.handleEvent.bind(this)));
      this.cleanup.push(relay.onOpen.subscribe(this.handleOpen.bind(this)));
    }

    for (const url of this.relayUrls) {
      relayPool.addClaim(url, this);
    }

    if (import.meta.env.DEV) {
      console.info(`Subscription ${this.name || this.id} opened`);
    }
  }
  close() {
    if (this.state === Subscription.CLOSED) return;
    this.state = Subscription.CLOSED;
    this.send(["CLOSE", this.id]);

    this.cleanup.forEach((sub) => sub.unsubscribe());

    for (const url of this.relayUrls) {
      relayPool.removeClaim(url, this);
    }

    if (import.meta.env.DEV) {
      console.info(`Subscription ${this.name || this.id} closed`);
    }
  }
}
