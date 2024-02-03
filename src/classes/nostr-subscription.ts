import { nanoid } from "nanoid";

import { NostrEvent } from "../types/nostr-event";
import { NostrOutgoingMessage, NostrRequestFilter } from "../types/nostr-query";
import Relay, { IncomingEOSE } from "./relay";
import relayPoolService from "../services/relay-pool";
import { Subject } from "./subject";

export default class NostrSubscription {
  static INIT = "initial";
  static OPEN = "open";
  static CLOSED = "closed";

  id: string;
  name?: string;
  query?: NostrRequestFilter;
  relay: Relay;
  state = NostrSubscription.INIT;
  onEvent = new Subject<NostrEvent>();
  onEOSE = new Subject<IncomingEOSE>();

  constructor(relayUrl: string | URL, query?: NostrRequestFilter, name?: string) {
    this.id = nanoid();
    this.query = query;
    this.name = name;

    this.relay = relayPoolService.requestRelay(relayUrl);

    this.onEvent.connectWithHandler(this.relay.onEvent, (event, next) => {
      if (this.state === NostrSubscription.OPEN) {
        next(event.body);
      }
    });
    this.onEOSE.connectWithHandler(this.relay.onEOSE, (eose, next) => {
      if (this.state === NostrSubscription.OPEN) next(eose);
    });
  }

  send(message: NostrOutgoingMessage) {
    this.relay.send(message);
  }

  open() {
    if (!this.query) throw new Error("cant open without a query");
    if (this.state === NostrSubscription.OPEN) return this;

    this.state = NostrSubscription.OPEN;
    if (Array.isArray(this.query)) {
      this.send(["REQ", this.id, ...this.query]);
    } else this.send(["REQ", this.id, this.query]);

    relayPoolService.addClaim(this.relay.url, this);

    return this;
  }
  setQuery(query: NostrRequestFilter) {
    this.query = query;
    if (this.state === NostrSubscription.OPEN) {
      if (Array.isArray(this.query)) {
        this.send(["REQ", this.id, ...this.query]);
      } else this.send(["REQ", this.id, this.query]);
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
