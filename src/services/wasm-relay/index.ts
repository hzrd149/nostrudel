import { type WorkerRelayInterface } from "@snort/worker-relay";
import { nanoid } from "nanoid";
import { SimpleRelay } from "nostr-idb";
import { Filter, NostrEvent } from "nostr-tools";
import { SubscriptionParams } from "nostr-tools/abstract-relay";

import { logger } from "../../helpers/debug";
import { WASM_RELAY_SUPPORTED } from "./supported";

export default class WasmRelay implements SimpleRelay {
  log = logger.extend("WasmRelay");
  url = "nostr-idb://wasm-worker";
  connected = false;
  worker?: WorkerRelayInterface;

  static SUPPORTED = WASM_RELAY_SUPPORTED;

  public baseEoseTimeout: number = 4400;
  private subscriptions: Map<string, WasmRelaySubscription> = new Map();

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

  async executeSubscription(sub: WasmRelaySubscription) {
    if (!this.worker) throw new Error("Worker not setup");

    const start = new Date().valueOf();
    this.log(`Running ${sub.id}`, sub.filters);

    // get events
    await this.worker.query(["REQ", sub.id, ...sub.filters]).then((events) => {
      const delta = new Date().valueOf() - start;
      this.log(`Finished ${sub.id} took ${delta}ms and got ${events.length} events`);

      for (const event of events) {
        if (!sub.alreadyHaveEvent || sub.alreadyHaveEvent(event.id)) {
          sub.onevent(event);
          sub.receivedEvent?.(this, event.id);
        }
      }
      if (sub.oneose) sub.oneose();
    });
  }

  subscribe(filters: Filter[], params: Partial<SubscriptionParams & { id: string }>): WasmRelaySubscription {
    // remove any duplicate subscriptions
    if (params.id && this.subscriptions.has(params.id)) {
      this.subscriptions.delete(params.id);
    }

    const id = params.id || nanoid(8);
    const sub = new WasmRelaySubscription(this, id, filters, params);

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

class WasmRelaySubscription {
  readonly relay: WasmRelay;
  readonly id: string;

  closed: boolean = false;
  eosed: boolean = false;
  filters: Filter[];
  alreadyHaveEvent: ((id: string) => boolean) | undefined;
  receivedEvent: ((relay: WasmRelay, id: string) => void) | undefined;

  onevent: (evt: NostrEvent) => void;
  oneose: (() => void) | undefined;
  onclose: ((reason: string) => void) | undefined;

  eoseTimeout: number;
  private eoseTimeoutHandle: ReturnType<typeof setTimeout> | undefined;

  constructor(relay: WasmRelay, id: string, filters: Filter[], params: SubscriptionParams) {
    this.relay = relay;
    this.filters = filters;
    this.id = id;
    this.alreadyHaveEvent = params.alreadyHaveEvent;
    // @ts-expect-error
    this.receivedEvent = params.receivedEvent;
    this.eoseTimeout = params.eoseTimeout || relay.baseEoseTimeout;

    this.oneose = params.oneose;
    this.onclose = params.onclose;
    this.onevent =
      params.onevent ||
      ((event) => {
        console.warn(
          `onevent() callback not defined for subscription '${this.id}' in relay ${this.relay.url}. event received:`,
          event,
        );
      });
  }

  public fire() {
    this.relay.executeSubscription(this);
    this.eoseTimeoutHandle = setTimeout(this.receivedEose.bind(this), this.eoseTimeout);
  }

  public receivedEose() {
    if (this.eosed) return;
    clearTimeout(this.eoseTimeoutHandle);
    this.eosed = true;
    this.oneose?.();
  }

  public close(reason: string = "closed by caller") {
    if (!this.closed && this.relay.connected) {
      this.relay.unsubscribe(this.id);
      this.closed = true;
    }
    this.onclose?.(reason);
  }
}
