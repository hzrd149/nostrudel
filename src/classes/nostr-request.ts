import { NostrEvent } from "../types/nostr-event";
import { NostrRequestFilter } from "../types/nostr-query";
import relayPoolService from "../services/relay-pool";
import { IncomingEOSE, IncomingEvent, Relay } from "./relay";
import Subject from "./subject";
import createDefer from "./deferred";

let lastId = 0;

const REQUEST_DEFAULT_TIMEOUT = 1000 * 5;
export class NostrRequest {
  static IDLE = "idle";
  static RUNNING = "running";
  static COMPLETE = "complete";

  id: string;
  timeout: number;
  relays: Set<Relay>;
  state = NostrRequest.IDLE;
  onEvent = new Subject<NostrEvent>();
  onComplete = createDefer<void>();
  seenEvents = new Set<string>();

  constructor(relayUrls: string[], timeout?: number, name?: string) {
    this.id = name || `request-${lastId++}`;
    this.relays = new Set(relayUrls.map((url) => relayPoolService.requestRelay(url)));

    for (const relay of this.relays) {
      relay.onEOSE.subscribe(this.handleEOSE, this);
      relay.onEvent.subscribe(this.handleEvent, this);
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

  start(filter: NostrRequestFilter) {
    if (this.state !== NostrRequest.IDLE) {
      throw new Error("cant restart a nostr request");
    }

    this.state = NostrRequest.RUNNING;
    for (const relay of this.relays) {
      if (Array.isArray(filter)) {
        relay.send(["REQ", this.id, ...filter]);
      } else relay.send(["REQ", this.id, filter]);
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
