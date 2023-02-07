import { Signal } from "../helpers/signal";
import relayPool from "./relays/relay-pool";
import settingsService from "./settings";

export class Subscription {
  static OPEN = "open";
  static IDLE = "open";
  static CLOSED = "closed";

  constructor(relayUrls, query) {
    this.id = String(Math.floor(Math.random() * 1000000));
    this.query = query;
    this.relayUrls = relayUrls;
    this.status = Subscription.IDLE;

    this.relays = relayUrls.map((url) => relayPool.requestRelay(url));

    this.onEvent = new Signal();
  }
  handleOpen(relay) {
    // when the relay connects send the req event
    relay.send(["REQ", this.id, this.query]);
  }
  handleEvent(event) {
    if (event.subId === this.id) {
      this.onEvent.emit(event.body);
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
    this.state = Subscription.OPEN;
    this.send(["REQ", this.id, this.query]);

    for (const relay of this.relays) {
      relay.onEvent.addListener(this.handleEvent, this);
      relay.onOpen.addListener(this.handleOpen, this);
    }

    for (const url of this.relayUrls) {
      relayPool.addClaim(url, this);
    }

    if (import.meta.env.DEV) {
      console.info(`Subscription ${this.id} opened`);
    }
  }
  close() {
    this.status = Subscription.CLOSED;
    this.send(["CLOSE", this.id]);

    for (const relay of this.relays) {
      relay.onEvent.removeListener(this.handleEvent, this);
      relay.onOpen.removeListener(this.handleOpen, this);
    }

    for (const url of this.relayUrls) {
      relayPool.removeClaim(url, this);
    }

    if (import.meta.env.DEV) {
      console.info(`Subscription ${this.id} closed`);
    }
  }
}

export async function createSubscription(query) {
  const urls = await settingsService.getRelays();
  return new Subscription(urls, query);
}
