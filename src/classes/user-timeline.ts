import dayjs from "dayjs";
import { NostrEvent } from "../types/nostr-event";
import { NostrQuery } from "../types/nostr-query";
import { NostrRequest } from "./nostr-request";
import { NostrMultiSubscription } from "./nostr-multi-subscription";
import { PersistentSubject } from "./subject";
import { utils } from "nostr-tools";
import { truncatedId } from "../helpers/nostr-event";

const PAGE_SIZE = 60 * 60 * 24 * 7; //in seconds

export default class UserTimeline {
  pubkey: string;
  query: NostrQuery;

  events = new PersistentSubject<NostrEvent[]>([]);
  loading = new PersistentSubject(false);
  page = new PersistentSubject(0);

  private seenEvents = new Set<string>();
  private subscription: NostrMultiSubscription;

  constructor(pubkey: string) {
    this.pubkey = pubkey;
    this.query = { authors: [pubkey], kinds: [1, 6], limit: 20 };

    this.subscription = new NostrMultiSubscription([], this.query, truncatedId(pubkey) + "-timeline");
    this.subscription.onEvent.subscribe(this.handleEvent, this);
  }

  setRelays(relays: string[]) {
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
    const start = this.events.value[0]?.created_at ?? dayjs().unix();
    const until = start - page * PAGE_SIZE;
    const since = until - PAGE_SIZE;

    return {
      until,
      since,
    };
  }

  loadMore() {
    if (this.loading.value) return;

    const query = { ...this.query, ...this.getPageDates(this.page.value) };
    const request = new NostrRequest(this.subscription.relayUrls);
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
