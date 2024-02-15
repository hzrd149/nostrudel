import { nanoid } from "nanoid";

import { NostrEvent } from "../types/nostr-event";
import { NostrOutgoingMessage, NostrRequestFilter } from "../types/nostr-query";
import Relay, { IncomingEOSE } from "./relay";
import relayPoolService from "../services/relay-pool";
import ControlledObservable from "./controlled-observable";

export default class NostrSubscription {
  static INIT = "initial";
  static OPEN = "open";
  static CLOSED = "closed";

  id: string;
  name?: string;
  query?: NostrRequestFilter;
  relay: Relay;
  state = NostrSubscription.INIT;
  onEvent = new ControlledObservable<NostrEvent>();
  onEOSE = new ControlledObservable<IncomingEOSE>();

  private subs: ZenObservable.Subscription[] = [];

  constructor(relayUrl: string | URL, query?: NostrRequestFilter, name?: string) {
    this.id = nanoid();
    this.query = query;
    this.name = name;

    this.relay = relayPoolService.requestRelay(relayUrl);

    this.subs.push(
      this.relay.onEvent.subscribe((message) => {
        if (this.state === NostrSubscription.OPEN && message.subId === this.id) {
          this.onEvent.next(message.body);
        }
      }),
    );
    this.subs.push(
      this.relay.onEOSE.subscribe((eose) => {
        if (this.state === NostrSubscription.OPEN && eose.subId === this.id) this.onEOSE.next(eose);
      }),
    );
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

    for (const sub of this.subs) sub.unsubscribe();
    this.subs = [];

    return this;
  }
}
