import { nanoid } from "nanoid";
import { Filter, NostrEvent } from "nostr-tools";

import Relay, { IncomingEOSE, OutgoingMessage } from "./relay";
import relayPoolService from "../services/relay-pool";
import ControlledObservable from "./controlled-observable";

export default class NostrSubscription {
  static INIT = "initial";
  static OPEN = "open";
  static CLOSED = "closed";

  id: string;
  name?: string;
  filters?: Filter[];
  relay: Relay;
  state = NostrSubscription.INIT;

  onEvent = new ControlledObservable<NostrEvent>();
  onEOSE = new ControlledObservable<IncomingEOSE>();

  private subs: ZenObservable.Subscription[] = [];

  constructor(relayUrl: string | URL, filters?: Filter[], name?: string) {
    this.id = nanoid();
    this.filters = filters;
    this.name = name;

    this.relay = relayPoolService.requestRelay(relayUrl);

    this.subs.push(
      this.relay.onEvent.subscribe((message) => {
        if (this.state === NostrSubscription.OPEN && message[1] === this.id) {
          this.onEvent.next(message[2]);
        }
      }),
    );
    this.subs.push(
      this.relay.onEOSE.subscribe((eose) => {
        if (this.state === NostrSubscription.OPEN && eose[1] === this.id) this.onEOSE.next(eose);
      }),
    );
  }

  send(message: OutgoingMessage) {
    this.relay.send(message);
  }
  setFilters(filters: Filter[]) {
    this.filters = filters;
    if (this.state === NostrSubscription.OPEN) {
      this.send(["REQ", this.id, ...this.filters]);
    }
    return this;
  }

  open() {
    if (!this.filters) throw new Error("cant open without a query");
    if (this.state === NostrSubscription.OPEN) return this;

    this.state = NostrSubscription.OPEN;
    this.send(["REQ", this.id, ...this.filters]);

    relayPoolService.addClaim(this.relay.url, this);

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
