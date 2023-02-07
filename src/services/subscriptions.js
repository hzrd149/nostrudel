import { Subject } from "rxjs";
import relayPool from "./relays/relay-pool";
import settingsService from "./settings";

export class Subscription {
  static OPEN = "open";
  static CLOSED = "closed";

  state = Subscription.CLOSED;
  onEvent = new Subject();
  cleanup = [];

  constructor(relayUrls, query, name) {
    this.id = String(Math.floor(Math.random() * 1000000));
    this.query = query;
    this.name = name;
    this.relayUrls = relayUrls;

    this.relays = relayUrls.map((url) => relayPool.requestRelay(url));
  }
  handleOpen(relay) {
    // when the relay connects send the req event
    relay.send(["REQ", this.id, this.query]);
  }
  handleEvent(event) {
    if (event.subId === this.id) {
      this.onEvent.next(event.body);
    }
  }
  send(message) {
    for (const relay of this.relays) {
      relay.send(message);
    }
  }

  setQuery(query) {
    this.query = query;

    // if open, than update remote subscription
    if (this.state === Subscription.OPEN) {
      this.send(["REQ", this.id, this.query]);
    }
  }
  open() {
    if (this.state === Subscription.OPEN || !this.query) return;
    this.state = Subscription.OPEN;
    this.send(["REQ", this.id, this.query]);

    for (const relay of this.relays) {
      this.cleanup.push(relay.onEvent.subscribe(this.handleEvent.bind(this)));
      this.cleanup.push(relay.onOpen.subscribe(this.handleOpen.bind(this)));
    }

    for (const url of this.relayUrls) {
      relayPool.addClaim(url, this);
    }

    if (import.meta.env.DEV) {
      console.info(`Subscription ${this.name || this.id} opened`);
    }
  }
  close() {
    if (this.state === Subscription.CLOSED) return;
    this.state = Subscription.CLOSED;
    this.send(["CLOSE", this.id]);

    this.cleanup.forEach((sub) => sub.unsubscribe());

    for (const url of this.relayUrls) {
      relayPool.removeClaim(url, this);
    }

    if (import.meta.env.DEV) {
      console.info(`Subscription ${this.name || this.id} closed`);
    }
  }
}

export async function createSubscription(query) {
  const urls = await settingsService.getRelays();
  return new Subscription(urls, query);
}
