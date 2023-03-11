import moment from "moment";
import { NostrEvent } from "../types/nostr-event";
import { NostrQuery } from "../types/nostr-query";
import { NostrRequest } from "./nostr-request";
import { NostrMultiSubscription } from "./nostr-multi-subscription";
import { PersistentSubject } from "./subject";
import { utils } from "nostr-tools";

type Options = {
  name?: string;
  pageSize: number;
  startLimit: number;
};
export type TimelineLoaderOptions = Partial<Options>;

export class TimelineLoader {
  relays: string[];
  query: NostrQuery;
  events = new PersistentSubject<NostrEvent[]>([]);
  loading = new PersistentSubject(false);
  page = new PersistentSubject(0);

  private seenEvents = new Set<string>();
  private subscription: NostrMultiSubscription;
  private opts: Options = { pageSize: moment.duration(1, "hour").asSeconds(), startLimit: 10 };

  constructor(relays: string[], query: NostrQuery, opts?: TimelineLoaderOptions) {
    this.relays = relays;
    Object.assign(this.opts, opts);
    this.query = { ...query, limit: this.opts.startLimit };

    this.subscription = new NostrMultiSubscription(relays, query, opts?.name);

    this.subscription.onEvent.subscribe(this.handleEvent, this);
  }

  setQuery(query: NostrQuery) {
    this.query = { ...query, limit: this.opts.startLimit };
    this.subscription.setQuery(this.query);
  }

  setRelays(relays: string[]) {
    this.relays = relays;
    this.subscription.setRelays(relays);
  }

  private handleEvent(event: NostrEvent) {
    if (!this.seenEvents.has(event.id)) {
      this.seenEvents.add(event.id);
      this.events.next(utils.insertEventIntoDescendingList(Array.from(this.events.value), event));
      if (this.loading.value) this.loading.next(false);
    }
  }

  private getPageDates(page: number) {
    const start = this.events.value[0]?.created_at ?? moment().unix();
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
    this.seenEvents.clear();
    this.subscription.forgetEvents();
  }
  open() {
    this.subscription.open();
  }
  close() {
    this.subscription.close();
  }
}
