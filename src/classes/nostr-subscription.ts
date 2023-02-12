import { Subject, SubscriptionLike } from "rxjs";
import { NostrEvent } from "../types/nostr-event";
import { NostrOutgoingMessage, NostrQuery } from "../types/nostr-query";
import { IncomingEOSE, IncomingEvent, Relay } from "./relay";
import relayPoolService from "../services/relay-pool";

let lastId = 10000;

export class NostrSubscription {
  static INIT = "initial";
  static OPEN = "open";
  static CLOSED = "closed";

  id: string;
  name?: string;
  query?: NostrQuery;
  relay: Relay;
  state = NostrSubscription.INIT;
  onEvent = new Subject<NostrEvent>();
  onEOSE = new Subject<IncomingEOSE>();

  constructor(relayUrl: string, query?: NostrQuery, name?: string) {
    this.id = String(name || lastId++);
    this.query = query;
    this.name = name;

    this.relay = relayPoolService.requestRelay(relayUrl);

    this.relay.onEvent.subscribe(this.handleEvent.bind(this));
    this.relay.onEOSE.subscribe(this.handleEOSE.bind(this));
  }

  private handleEvent(event: IncomingEvent) {
    if (this.state === NostrSubscription.OPEN && event.subId === this.id) {
      this.onEvent.next(event.body);
    }
  }
  private handleEOSE(eose: IncomingEOSE) {
    if (this.state === NostrSubscription.OPEN && eose.subId === this.id) {
      this.onEOSE.next(eose);
    }
  }

  send(message: NostrOutgoingMessage) {
    this.relay.send(message);
  }

  open() {
    if (!this.query) throw new Error("cant open without a query");
    if (this.state === NostrSubscription.OPEN) return this;

    this.state = NostrSubscription.OPEN;
    this.send(["REQ", this.id, this.query]);

    relayPoolService.addClaim(this.relay.url, this);

    return this;
  }
  setQuery(query: NostrQuery) {
    this.query = query;
    if (this.state === NostrSubscription.OPEN) {
      this.send(["REQ", this.id, this.query]);
    }
    return this;
  }
  close() {
    if (this.state !== NostrSubscription.OPEN) return this;

    // set state
    this.state = NostrSubscription.CLOSED;
    // send close message
    this.send(["CLOSE", this.id]);
    // unsubscribe from relay messages
    relayPoolService.removeClaim(this.relay.url, this);

    return this;
  }
}
