import { Subject, Subscription as RxSubscription } from "rxjs";
import { NostrEvent } from "../types/nostr-event";
import { NostrQuery } from "../types/nostr-query";
import { Relay } from "../services/relays";
import relayPool from "../services/relays/relay-pool";

let lastId = 0;

const REQUEST_DEFAULT_TIMEOUT = 1000 * 20;
export class NostrRequest {
  static IDLE = "idle";
  static RUNNING = "running";
  static COMPLETE = "complete";

  id: string;
  timeout: number;
  relays: Set<Relay>;
  relayCleanup = new Map<Relay, RxSubscription[]>();
  state = NostrRequest.IDLE;
  onEvent = new Subject<NostrEvent>();
  seenEvents = new Set<string>();

  constructor(relayUrls: string[], timeout?: number) {
    this.id = `request-${lastId++}`;
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
          if (this.state === NostrRequest.RUNNING && event.subId === this.id && !this.seenEvents.has(event.body.id)) {
            this.onEvent.next(event.body);
            this.seenEvents.add(event.body.id);
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
      this.state = NostrRequest.COMPLETE;
      this.onEvent.complete();
    }
  }

  start(query: NostrQuery) {
    if (this.state !== NostrRequest.IDLE) return this;

    this.state = NostrRequest.RUNNING;
    for (const relay of this.relays) {
      relay.send(["REQ", this.id, query]);
    }

    setTimeout(() => {
      console.log(`NostrRequest: ${this.id} timed out`);
      this.cancel();
    }, this.timeout);

    console.log(`NostrRequest: ${this.id} started`);

    return this;
  }
  cancel() {
    if (this.state !== NostrRequest.COMPLETE) return this;

    this.state = NostrRequest.COMPLETE;
    for (const relay of this.relays) {
      relay.send(["CLOSE", this.id]);
    }
    for (const [relay, fns] of this.relayCleanup) {
      for (const fn of fns) fn.unsubscribe();
    }
    this.relayCleanup = new Map();
    this.relays = new Set();
    this.onEvent.complete();

    console.log(`NostrRequest: ${this.id} complete`);

    return this;
  }
}
