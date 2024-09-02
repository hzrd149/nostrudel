import { nanoid } from "nanoid";
import { SimpleRelay, Subscription, SubscriptionOptions } from "nostr-idb";
import { Filter, NostrEvent, matchFilters } from "nostr-tools";

import EventStore from "./event-store";
import { logger } from "../helpers/debug";

export default class MemoryRelay implements SimpleRelay {
  log = logger.extend("MemoryRelay");
  connected = true;
  url = ":memory:";

  events = new EventStore();
  subscriptions = new Map<string, Subscription>();

  constructor() {
    this.events.onEvent.subscribe((event) => {
      for (const [id, sub] of this.subscriptions) {
        if (sub.onevent && matchFilters(sub.filters, event)) sub.onevent(event);
      }
    });
  }

  async connect() {}
  close(): void {}

  async publish(event: NostrEvent) {
    this.events.addEvent(event);
    return "accepted";
  }

  private async executeSubscription(sub: Subscription) {
    const limit = sub.filters.reduce((v, f) => (f.limit ? Math.min(v, f.limit) : v), Infinity);

    let count = 0;
    if (sub.onevent) {
      const events = this.events.getSortedEvents();
      for (const event of events) {
        if (matchFilters(sub.filters, event)) {
          sub.onevent(event);
          count++;
        }
        if (count === limit) break;
      }
    }

    this.log(`Ran ${sub.id} and got ${count} events`, sub.filters);

    if (sub.oneose) sub.oneose();
  }

  subscribe(filters: Filter[], options: SubscriptionOptions) {
    const sub: Subscription = {
      id: nanoid(8),
      filters,
      ...options,
      fire: () => {
        this.executeSubscription(sub);
      },
      close: () => {
        this.subscriptions.delete(sub.id);
      },
    };

    this.subscriptions.set(sub.id, sub);
    setTimeout(() => {
      this.executeSubscription(sub);
    }, 0);
    return sub;
  }

  async count(
    filters: Filter[],
    params?: {
      id?: string | null;
    },
  ) {
    let count = 0;
    for (const [id, event] of this.events.events) {
      if (matchFilters(filters, event)) count++;
    }
    return count;
  }
}
