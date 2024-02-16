import { nanoid } from "nanoid";

import { NostrEvent } from "../types/nostr-event";
import { NostrRequestFilter } from "../types/nostr-relay";
import relayPoolService from "../services/relay-pool";
import Relay, { CountResponse, IncomingCount, IncomingEOSE, IncomingEvent } from "./relay";
import createDefer from "./deferred";
import ControlledObservable from "./controlled-observable";
import SuperMap from "./super-map";

const REQUEST_DEFAULT_TIMEOUT = 1000 * 5;
export default class NostrRequest {
  static IDLE = "idle";
  static RUNNING = "running";
  static COMPLETE = "complete";

  id = nanoid();
  timeout: number;
  relays: Set<Relay>;
  state = NostrRequest.IDLE;
  onEvent = new ControlledObservable<NostrEvent>();
  onCount = new ControlledObservable<CountResponse>();
  onComplete = createDefer<void>();
  seenEvents = new Set<string>();

  private relaySubs: SuperMap<Relay, ZenObservable.Subscription[]> = new SuperMap(() => []);

  constructor(relayUrls: Iterable<string>, timeout?: number) {
    this.relays = new Set(Array.from(relayUrls).map((url) => relayPoolService.requestRelay(url)));

    for (const relay of this.relays) {
      const subs = this.relaySubs.get(relay);
      subs.push(relay.onEOSE.subscribe((m) => this.handleEOSE(m, relay)));
      subs.push(relay.onEvent.subscribe(this.handleEvent.bind(this)));
      subs.push(relay.onCount.subscribe(this.handleCount.bind(this)));
    }

    this.timeout = timeout ?? REQUEST_DEFAULT_TIMEOUT;
  }

  handleEOSE(message: IncomingEOSE, relay: Relay) {
    if (message[1] === this.id) {
      this.relays.delete(relay);
      relay.send(["CLOSE", this.id]);

      this.relaySubs.get(relay).forEach((sub) => sub.unsubscribe());
      this.relaySubs.delete(relay);

      if (this.relays.size === 0) {
        this.state = NostrRequest.COMPLETE;
        this.onComplete.resolve();
      }
    }
  }
  handleEvent(message: IncomingEvent) {
    if (this.state === NostrRequest.RUNNING && message[1] === this.id && !this.seenEvents.has(message[2].id)) {
      this.onEvent.next(message[2]);
      this.seenEvents.add(message[2].id);
    }
  }
  handleCount(incomingCount: IncomingCount) {
    if (incomingCount[1] === this.id) {
      this.onCount.next(incomingCount[2]);
    }
  }

  start(filter: NostrRequestFilter, type: "REQ" | "COUNT" = "REQ") {
    if (this.state !== NostrRequest.IDLE) {
      throw new Error("cant restart a nostr request");
    }

    this.state = NostrRequest.RUNNING;
    for (const relay of this.relays) {
      if (Array.isArray(filter)) {
        relay.send([type, this.id, ...filter]);
      } else relay.send([type, this.id, filter]);
    }

    setTimeout(() => this.complete(), this.timeout);

    return this;
  }
  complete() {
    if (this.state === NostrRequest.COMPLETE) return this;

    this.state = NostrRequest.COMPLETE;
    for (const relay of this.relays) {
      relay.send(["CLOSE", this.id]);
      this.relaySubs.get(relay).forEach((sub) => sub.unsubscribe());
    }
    this.relaySubs.clear();
    this.onComplete.resolve();

    return this;
  }
}
