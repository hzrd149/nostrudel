import moment from "moment";
import { NostrEvent } from "../types/nostr-event";
import { NostrQuery } from "../types/nostr-query";
import { NostrRequest } from "./nostr-request";
import { NostrMultiSubscription } from "./nostr-multi-subscription";
import Subject, { PersistentSubject } from "./subject";

export type NostrQueryWithStart = NostrQuery & { since: number };

type Options = {
  name?: string;
  pageSize: number;
};
export type TimelineLoaderOptions = Partial<Options>;

export class TimelineLoader {
  relays: string[];
  query: NostrQueryWithStart;
  events = new PersistentSubject<NostrEvent[]>([]);
  loading = new PersistentSubject(false);
  page = new PersistentSubject(0);

  private eventDir = new Map<string, NostrEvent>();
  private subscription: NostrMultiSubscription;
  private opts: Options = { pageSize: moment.duration(1, "hour").asSeconds() };

  constructor(relays: string[], query: NostrQueryWithStart, opts?: TimelineLoaderOptions) {
    if (!query.since) throw new Error('Timeline requires "since" to be set in query');

    this.relays = relays;
    this.query = query;
    Object.assign(this.opts, opts);

    this.subscription = new NostrMultiSubscription(relays, query, opts?.name);

    this.subscription.onEvent.subscribe(this.handleEvent.bind(this));
  }

  setQuery(query: NostrQueryWithStart) {
    if (!query.since) throw new Error('Timeline requires "since" to be set in query');

    this.query = query;
    this.subscription.setQuery(query);
  }

  setRelays(relays: string[]) {
    this.relays = relays;
    this.subscription.setRelays(relays);
  }

  private handleEvent(event: NostrEvent) {
    if (!this.eventDir.has(event.id)) {
      this.eventDir.set(event.id, event);
      this.events.next(Array.from(this.eventDir.values()).sort((a, b) => b.created_at - a.created_at));
      if (this.loading.value) this.loading.next(false);
    }
  }

  private getPageDates(page: number) {
    const start = this.query.since;
    const until = start - page * this.opts.pageSize;
    const since = until - this.opts.pageSize;

    return {
      until,
      since,
    };
  }

  loadMore() {
    if (this.loading.value) return;

    const query = { ...this.query, ...this.getPageDates(this.page.value) };
    const request = new NostrRequest(this.relays);
    request.onEvent.subscribe(this.handleEvent, this);
    request.onComplete.then(() => {
      this.loading.next(false);
    });
    request.start(query);

    this.loading.next(true);
    this.page.next(this.page.value + 1);
  }

  forgetEvents() {
    this.events.next([]);
    this.eventDir.clear();
    this.subscription.forgetEvents();
  }
  open() {
    this.subscription.open();
  }
  close() {
    this.subscription.close();
  }
}
