import { nanoid } from "nanoid";
import { CountResponse, NostrEvent } from "../types/nostr-event";
import { NostrRequestFilter } from "../types/nostr-query";
import relayPoolService from "../services/relay-pool";
import Relay, { IncomingCount, IncomingEOSE, IncomingEvent } from "./relay";
import Subject from "./subject";
import createDefer from "./deferred";

const REQUEST_DEFAULT_TIMEOUT = 1000 * 5;
export default class NostrRequest {
  static IDLE = "idle";
  static RUNNING = "running";
  static COMPLETE = "complete";

  id: string;
  timeout: number;
  relays: Set<Relay>;
  state = NostrRequest.IDLE;
  onEvent = new Subject<NostrEvent>(undefined, false);
  onCount = new Subject<CountResponse>(undefined, false);
  onComplete = createDefer<void>();
  seenEvents = new Set<string>();

  constructor(relayUrls: Iterable<string>, timeout?: number) {
    this.id = nanoid();
    this.relays = new Set(Array.from(relayUrls).map((url) => relayPoolService.requestRelay(url)));

    for (const relay of this.relays) {
      relay.onEOSE.subscribe(this.handleEOSE, this);
      relay.onEvent.subscribe(this.handleEvent, this);
      relay.onCount.subscribe(this.handleCount, this);
    }

    this.timeout = timeout ?? REQUEST_DEFAULT_TIMEOUT;
  }

  handleEOSE(eose: IncomingEOSE) {
    if (eose.subId === this.id) {
      const relay = eose.relay;
      this.relays.delete(relay);
      relay.send(["CLOSE", this.id]);

      relay.onEOSE.unsubscribe(this.handleEOSE, this);
      relay.onEvent.unsubscribe(this.handleEvent, this);

      if (this.relays.size === 0) {
        this.state = NostrRequest.COMPLETE;
        this.onComplete.resolve();
      }
    }
  }
  handleEvent(incomingEvent: IncomingEvent) {
    if (
      this.state === NostrRequest.RUNNING &&
      incomingEvent.subId === this.id &&
      !this.seenEvents.has(incomingEvent.body.id)
    ) {
      this.onEvent.next(incomingEvent.body);
      this.seenEvents.add(incomingEvent.body.id);
    }
  }
  handleCount(incomingCount: IncomingCount) {
    if (incomingCount.subId === this.id) {
      this.onCount.next({ count: incomingCount.count, approximate: incomingCount.approximate });
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
      relay.onEOSE.unsubscribe(this.handleEOSE, this);
      relay.onEvent.unsubscribe(this.handleEvent, this);
    }
    this.onComplete.resolve();

    return this;
  }
}
