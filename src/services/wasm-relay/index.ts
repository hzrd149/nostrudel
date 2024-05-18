import { type WorkerRelayInterface } from "@snort/worker-relay";
import { nanoid } from "nanoid";
import { SimpleRelay, Subscription, SubscriptionOptions } from "nostr-idb";
import { Filter, NostrEvent } from "nostr-tools";
import { logger } from "../../helpers/debug";
import { WASM_RELAY_SUPPORTED } from "./supported";

export default class WasmRelay implements SimpleRelay {
  log = logger.extend("WasmRelay");
  url = "nostr-idb://wasm-worker";
  connected = false;
  worker?: WorkerRelayInterface;

  static SUPPORTED = WASM_RELAY_SUPPORTED;

  private subscriptions: Map<
    string,
    SubscriptionOptions & {
      filters: Filter[];
    }
  > = new Map();

  async connect() {
    if (this.connected || this.worker) return;

    console.time("Starting Wasm Worker");
    const { default: worker } = await import("./worker");
    this.worker = worker;
    this.connected = true;
    console.timeEnd("Starting Wasm Worker");
  }
  async close() {
    console.error("Cant stop wasm worker");
  }

  async publish(event: NostrEvent) {
    if (!this.worker) throw new Error("Worker not setup");
    const res = await this.worker.event(event);
    if (res.message) return res.message;
    return res.ok ? "success" : "failed";
  }

  async count(filters: Filter[], params: { id?: string | null }) {
    if (!this.worker) throw new Error("Worker not setup");
    return await this.worker.count(["REQ", params.id || nanoid(8), ...filters]);
  }

  private async executeSubscription(sub: Subscription) {
    if (!this.worker) throw new Error("Worker not setup");

    const start = new Date().valueOf();
    this.log(`Running ${sub.id}`, sub.filters);

    // get events
    await this.worker.query(["REQ", sub.id, ...sub.filters]).then((events) => {
      const delta = new Date().valueOf() - start;
      this.log(`Finished ${sub.id} took ${delta}ms and got ${events.length} events`);

      if (sub.onevent) {
        for (const event of events) sub.onevent(event);
      }
      if (sub.oneose) sub.oneose();
    });
  }

  subscribe(filters: Filter[], options: Partial<SubscriptionOptions>): Subscription {
    // remove any duplicate subscriptions
    if (options.id && this.subscriptions.has(options.id)) {
      this.subscriptions.delete(options.id);
    }

    const id = options.id || nanoid(8);

    const sub = {
      id,
      filters,
      close: () => this.subscriptions.delete(id),
      fire: () => this.executeSubscription(sub),
      ...options,
    };

    this.subscriptions.set(id, sub);

    this.executeSubscription(sub);

    return sub;
  }

  unsubscribe(id: string) {
    const sub = this.subscriptions.get(id);
    if (sub) {
      sub.onclose?.("unsubscribe");
      this.subscriptions.delete(id);
    }
  }
}
