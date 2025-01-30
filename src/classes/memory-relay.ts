import { nanoid } from "nanoid";
import { Subscription as RxSubscription } from "rxjs";
import { SimpleRelay, Subscription, SubscriptionOptions } from "nostr-idb";
import { Filter, NostrEvent } from "nostr-tools";
import { EventStore } from "applesauce-core";

import { logger } from "../helpers/debug";

export default class MemoryRelay implements SimpleRelay {
  log = logger.extend("MemoryRelay");
  connected = true;
  url = ":memory:";

  store = new EventStore();
  subscriptions = new Map<string, Subscription>();

  async connect() {}
  close(): void {}

  async publish(event: NostrEvent) {
    this.store.add(event);
    return "";
  }

  subscribe(filters: Filter[], options: SubscriptionOptions) {
    let stream: RxSubscription | undefined = undefined;
    const sub: Subscription = {
      id: nanoid(8),
      filters,
      ...options,
      fire: () => {
        if (stream) stream.unsubscribe();
        stream = this.store.stream(filters).subscribe((event) => sub.onevent?.(event));
        if (sub.oneose) sub.oneose();
      },
      close: () => {
        this.subscriptions.delete(sub.id);
        if (stream) stream.unsubscribe();
      },
    };
    this.subscriptions.set(sub.id, sub);

    setTimeout(() => {
      sub.fire();
    }, 0);

    return sub;
  }

  async count(
    filters: Filter[],
    params?: {
      id?: string | null;
    },
  ) {
    return this.store.database.getForFilters(filters).size;
  }
}
