import { Subject, Subscription as RxSubscription } from "rxjs";
import { NostrEvent } from "../types/nostr-event";
import { NostrQuery } from "../types/nostr-query";
import { Relay } from "./relays";
import relayPool from "./relays/relay-pool";

const REQUEST_DEFAULT_TIMEOUT = 1000 * 20;
export class Request {
  static IDLE = "idle";
  static RUNNING = "running";
  static COMPLETE = "complete";

  id: string;
  timeout: number;
  relays: Set<Relay>;
  relayCleanup = new Map<Relay, RxSubscription[]>();
  state = Request.IDLE;
  onEvent = new Subject<NostrEvent>();

  constructor(relayUrls: string[], timeout?: number) {
    this.id = String(Math.floor(Math.random() * 1000000));
    this.relays = new Set(relayUrls.map((url) => relayPool.requestRelay(url)));

    for (const relay of this.relays) {
      const cleanup: RxSubscription[] = [];

      cleanup.push(
        relay.onEndOfStoredEvents.subscribe((event) => {
          if (event.subId === this.id) {
            this.handleEndOfEvents(relay);
          }
        })
      );

      cleanup.push(
        relay.onEvent.subscribe((event) => {
          if (event.subId === this.id) {
            this.onEvent.next(event.body);
          }
        })
      );

      this.relayCleanup.set(relay, cleanup);
    }

    this.timeout = timeout ?? REQUEST_DEFAULT_TIMEOUT;
  }

  handleEndOfEvents(relay: Relay) {
    this.relays.delete(relay);
    relay.send(["CLOSE", this.id]);

    const cleanup = this.relayCleanup.get(relay) ?? [];
    for (const fn of cleanup) fn.unsubscribe();

    if (this.relays.size === 0) {
      this.state = Request.COMPLETE;
      this.onEvent.complete();
    }
  }

  start(query: NostrQuery) {
    if (this.state !== Request.IDLE) return this;

    this.state = Request.RUNNING;
    for (const relay of this.relays) {
      relay.send(["REQ", this.id, query]);
    }

    setTimeout(() => {
      this.cancel();
    }, this.timeout);

    return this;
  }
  cancel() {
    if (this.state !== Request.COMPLETE) return this;

    this.state = Request.COMPLETE;
    for (const relay of this.relays) {
      relay.send(["CLOSE", this.id]);
    }
    for (const [relay, fns] of this.relayCleanup) {
      for (const fn of fns) fn.unsubscribe();
    }
    this.relayCleanup = new Map();
    this.relays = new Set();
    this.onEvent.complete();

    return this;
  }
}
