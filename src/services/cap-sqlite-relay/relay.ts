import { type SQLiteDBConnection } from "@capacitor-community/sqlite";
import { type SimpleRelay, type SubscriptionOptions, type Subscription } from "nostr-idb";
import { Filter, NostrEvent } from "nostr-tools";
import { nanoid } from "nanoid";

import SQLiteEventStore from "./event-store";
import sqliteService from "./sqlite";
import createDefer, { Deferred } from "../../classes/deferred";
import { logger } from "../../helpers/debug";

export default class CapacitorSQLiteRelay implements SimpleRelay {
  log = logger.extend("CapacitorSQLiteRelay");
  url = "";
  database: SQLiteDBConnection;
  eventStore: SQLiteEventStore;

  baseEoseTimeout = 4_000;
  connectionTimeout = 10_000;

  onclose: (() => void) | null = null;
  onnotice: (msg: string) => void = () => {};
  _onauth: ((challenge: string) => void) | null = null;

  openSubs = new Map<string, Subscription>();

  constructor(database: SQLiteDBConnection) {
    this.database = database;
    this.eventStore = new SQLiteEventStore(this.database);
  }

  private open = false;
  get connected() {
    return this.open;
  }
  async connect(): Promise<void> {
    this.url = (await this.database.getUrl()).url ?? "";
    this.open = true;
  }

  async close() {
    if (this.database) {
      await sqliteService.closeDatabase(this.database.getConnectionDBName(), false);
    }
    this.open = false;
  }

  queue: [NostrEvent, Deferred<string>][] = [];
  publish(event: NostrEvent) {
    const p = createDefer<string>();
    this.queue.push([event, p]);
    this.processNext();
    return p;
  }
  private runningQueue = false;
  private async processNext() {
    if (this.runningQueue) return;
    this.runningQueue = true;

    const BATCH_SIZE = 1000;
    let i = 0;
    let eventInserted = 0;
    while (this.queue.length > 0) {
      const next = this.queue.shift();
      if (!next) break;
      const [event, promise] = next;

      try {
        const inserted = await this.eventStore.addEvent(event);
        if (inserted) {
          promise.resolve("Added");
          eventInserted++;
        } else promise.resolve("Duplicate");
      } catch (error) {
        promise.reject(new Error("Rejected"));
      }

      if (++i >= BATCH_SIZE) break;
    }

    if (this.queue.length > 0) {
      this.log(`Inserted ${eventInserted}, ${this.queue.length} left in queue`);
      setTimeout(this.processNext.bind(this), 100);
    } else {
      this.log(`Inserted ${eventInserted}, Done`);
      this.runningQueue = false;
    }
  }

  async count(filters: Filter[], params?: { id?: string | null }) {
    return this.eventStore.countEventsForFilters(filters);
  }
  subscribe(filters: Filter[], options: SubscriptionOptions) {
    const sub: Subscription = {
      id: nanoid(),
      filters,
      ...options,
      close: () => {
        sub.onclose?.("none");
      },
      fire: () => {
        if (sub.onevent) {
          this.eventStore.getEventsForFilters(filters).then((events) => {
            for (const event of events) {
              sub.onevent?.(event);
            }

            sub.oneose?.();
          });
        }
      },
    };

    sub.fire();

    return sub;
  }
}
