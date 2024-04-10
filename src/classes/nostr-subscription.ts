import { nanoid } from "nanoid";
import { Filter, NostrEvent, Relay, Subscription } from "nostr-tools";

import relayPoolService from "../services/relay-pool";
import ControlledObservable from "./controlled-observable";

/** @deprecated use relay.subscribe instead */
export default class NostrSubscription {
  static INIT = "initial";
  static OPEN = "open";
  static CLOSED = "closed";

  id: string;
  name?: string;
  filters?: Filter[];
  relay: Relay;
  state = NostrSubscription.INIT;

  subscription: Subscription | null = null;

  onEvent = new ControlledObservable<NostrEvent>();
  onEOSE = new ControlledObservable<number>();

  constructor(relayUrl: string | URL, filters?: Filter[], name?: string) {
    this.id = nanoid();
    this.filters = filters;
    this.name = name;

    this.relay = relayPoolService.requestRelay(relayUrl);
  }

  setFilters(filters: Filter[]) {
    this.filters = filters;
    if (this.state === NostrSubscription.OPEN && this.subscription) {
      this.subscription.filters = this.filters;
      this.subscription.fire();
    }
    return this;
  }

  open() {
    if (!this.filters) throw new Error("cant open without a query");
    if (this.state === NostrSubscription.OPEN) return this;

    this.state = NostrSubscription.OPEN;
    this.subscription = this.relay.subscribe(this.filters, {
      onevent: (event) => this.onEvent.next(event),
      oneose: () => this.onEOSE.next(Math.random()),
    });

    relayPoolService.addClaim(this.relay.url, this);

    return this;
  }
  close() {
    if (this.state !== NostrSubscription.OPEN) return this;

    // set state
    this.state = NostrSubscription.CLOSED;
    // send close message
    this.subscription?.close();
    // unsubscribe from relay messages
    relayPoolService.removeClaim(this.relay.url, this);

    return this;
  }
}
