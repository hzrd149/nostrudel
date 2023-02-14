import { NostrEvent } from "../types/nostr-event";
import { NostrQuery } from "../types/nostr-query";
import relayPoolService from "../services/relay-pool";
import { IncomingEOSE, IncomingEvent, Relay } from "./relay";
import Subject from "./subject";
import createDefer from "./deferred";

let lastId = 0;

const REQUEST_DEFAULT_TIMEOUT = 1000 * 20;
export class NostrRequest {
  static IDLE = "idle";
  static RUNNING = "running";
  static COMPLETE = "complete";

  id: string;
  timeout: number;
  relays: Set<Relay>;
  relayCleanup = new Map<Relay, Function>();
  state = NostrRequest.IDLE;
  onEvent = new Subject<NostrEvent>();
  onComplete = createDefer<void>();
  seenEvents = new Set<string>();

  constructor(relayUrls: string[], timeout?: number) {
    this.id = `request-${lastId++}`;
    this.relays = new Set(relayUrls.map((url) => relayPoolService.requestRelay(url)));

    for (const relay of this.relays) {
      const handleEOSE = (event: IncomingEOSE) => {
        if (event.subId === this.id) {
          this.handleEndOfEvents(relay);
        }
      };
      relay.onEOSE.subscribe(handleEOSE);

      const handleEvent = (event: IncomingEvent) => {
        if (this.state === NostrRequest.RUNNING && event.subId === this.id && !this.seenEvents.has(event.body.id)) {
          this.onEvent.next(event.body);
          this.seenEvents.add(event.body.id);
        }
      };
      relay.onEvent.subscribe(handleEvent);

      this.relayCleanup.set(relay, () => {
        relay.onEOSE.unsubscribe(handleEOSE);
        relay.onEvent.unsubscribe(handleEvent);
      });
    }

    this.timeout = timeout ?? REQUEST_DEFAULT_TIMEOUT;
  }

  handleEndOfEvents(relay: Relay) {
    this.relays.delete(relay);
    relay.send(["CLOSE", this.id]);

    const cleanup = this.relayCleanup.get(relay);
    if (cleanup) cleanup();

    if (this.relays.size === 0) {
      this.state = NostrRequest.COMPLETE;
      this.onComplete.resolve();
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
    for (const [relay, cleanup] of this.relayCleanup) {
      if (cleanup) cleanup();
    }
    this.relayCleanup = new Map();
    this.relays = new Set();
    this.onComplete.resolve();

    console.log(`NostrRequest: ${this.id} complete`);

    return this;
  }
}
