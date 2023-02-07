import { Subject, SubscriptionLike } from "rxjs";
import { NostrEvent } from "../types/nostr-event";
import { NostrOutgoingMessage, NostrQuery } from "../types/nostr-query";
import { Relay } from "../services/relays";
import { IncomingEvent } from "../services/relays/relay";
import relayPool from "../services/relays/relay-pool";

let lastId = 0;

export class NostrSubscription {
  static INIT = "initial";
  static OPEN = "open";
  static CLOSED = "closed";

  id: string;
  name?: string;
  query?: NostrQuery;
  relayUrls: string[];
  relays: Relay[];
  state = NostrSubscription.INIT;
  onEvent = new Subject<NostrEvent>();
  seenEvents = new Set<string>();

  constructor(relayUrls: string[], query?: NostrQuery, name?: string) {
    this.id = String(name || lastId++);
    this.query = query;
    this.name = name;
    this.relayUrls = relayUrls;

    this.relays = relayUrls.map((url) => relayPool.requestRelay(url));
  }
  handleOpen(relay: Relay) {
    if (this.query) {
      // when the relay connects send the req event
      relay.send(["REQ", this.id, this.query]);
    }
  }
  handleEvent(event: IncomingEvent) {
    if (this.state === NostrSubscription.OPEN && event.subId === this.id && !this.seenEvents.has(event.body.id)) {
      this.onEvent.next(event.body);
      this.seenEvents.add(event.body.id);
    }
  }
  send(message: NostrOutgoingMessage) {
    for (const relay of this.relays) {
      relay.send(message);
    }
  }

  cleanup: SubscriptionLike[] = [];
  /** listen for event and open events from relays */
  private subscribeToRelays() {
    for (const relay of this.relays) {
      this.cleanup.push(relay.onEvent.subscribe(this.handleEvent.bind(this)));
      this.cleanup.push(relay.onOpen.subscribe(this.handleOpen.bind(this)));
    }

    for (const url of this.relayUrls) {
      relayPool.addClaim(url, this);
    }
  }
  /** listen for event and open events from relays */
  private unsubscribeToRelays() {
    this.cleanup.forEach((sub) => sub.unsubscribe());

    for (const url of this.relayUrls) {
      relayPool.removeClaim(url, this);
    }
  }

  open() {
    if (!this.query) throw new Error("cant open without a query");
    if (this.state === NostrSubscription.OPEN) return this;

    this.state = NostrSubscription.OPEN;
    this.send(["REQ", this.id, this.query]);

    this.subscribeToRelays();

    if (import.meta.env.DEV) {
      console.info(`Subscription: "${this.name || this.id}" opened`);
    }

    return this;
  }
  update(query: NostrQuery) {
    this.query = query;
    if (this.state === NostrSubscription.OPEN) {
      this.send(["REQ", this.id, this.query]);
    }
    return this;
  }
  setRelays(relays: string[]) {
    this.unsubscribeToRelays();

    // get new relays
    this.relayUrls = relays;
    this.relays = relays.map((url) => relayPool.requestRelay(url));

    this.subscribeToRelays();
  }
  close() {
    if (this.state !== NostrSubscription.OPEN) return this;

    // set state
    this.state = NostrSubscription.CLOSED;
    // send close message
    this.send(["CLOSE", this.id]);
    // forget all seen events
    this.seenEvents.clear();
    // unsubscribe from relay messages
    this.unsubscribeToRelays();

    if (import.meta.env.DEV) {
      console.info(`Subscription: "${this.name || this.id}" closed`);
    }

    return this;
  }
}
