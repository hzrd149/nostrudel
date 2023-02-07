import { Signal } from "../helpers/signal";
import { getAllActive } from "./relays";

export class Subscription {
  static OPEN = "open";
  static CLOSED = "closed";

  constructor(relays, query) {
    this.id = String(Math.floor(Math.random() * 1000000));
    this.relays = relays;
    this.status = Subscription.OPEN;

    this.onEvent = new Signal();

    for (const relay of this.relays) {
      relay.onEvent.addListener(this.handleEvent, this);
    }

    this.send(["REQ", this.id, query]);
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
  close() {
    this.status = Subscription.CLOSED;
    this.send(["CLOSE", this.id]);

    for (const relay of this.relays) {
      relay.onEvent.removeListener(this.handleEvent, this);
    }
  }
}

export function createSubscription(query) {
  const relays = getAllActive();
  return new Subscription(relays, query);
}
