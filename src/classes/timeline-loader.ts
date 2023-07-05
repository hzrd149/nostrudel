import dayjs from "dayjs";
import { utils } from "nostr-tools";
import { NostrEvent } from "../types/nostr-event";
import { NostrQuery, NostrRequestFilter } from "../types/nostr-query";
import { NostrRequest } from "./nostr-request";
import { NostrMultiSubscription } from "./nostr-multi-subscription";
import Subject, { PersistentSubject } from "./subject";

function addToQuery(filter: NostrRequestFilter, query: NostrQuery) {
  if (Array.isArray(filter)) {
    return filter.map((f) => ({ ...f, ...query }));
  }
  return { ...filter, ...query };
}

const BLOCK_SIZE = 20;

type EventFilter = (event: NostrEvent) => boolean;

class RelayTimelineLoader {
  relay: string;
  query: NostrRequestFilter;
  blockSize = BLOCK_SIZE;
  private name?: string;
  private requestId = 0;

  loading = false;
  events: NostrEvent[] = [];
  /** set to true when the next block produces 0 events */
  complete = false;

  onEvent = new Subject<NostrEvent>();
  onBlockFinish = new Subject<void>();

  constructor(relay: string, query: NostrRequestFilter, name?: string) {
    this.relay = relay;
    this.query = query;
    this.name = name;
  }

  loadNextBlock() {
    this.loading = true;
    let query: NostrRequestFilter = addToQuery(this.query, { limit: this.blockSize });
    if (this.events[this.events.length - 1]) {
      query = addToQuery(query, { until: this.events[this.events.length - 1].created_at + 1 });
    }

    const request = new NostrRequest([this.relay], undefined, this.name + "-" + this.requestId++);

    let gotEvents = 0;
    request.onEvent.subscribe((e) => {
      if (this.handleEvent(e)) {
        gotEvents++;
      }
    });
    request.onComplete.then(() => {
      this.loading = false;
      if (gotEvents === 0) this.complete = true;
      this.onBlockFinish.next();
    });

    request.start(query);
  }

  private seenEvents = new Set<string>();
  private handleEvent(event: NostrEvent) {
    if (!this.seenEvents.has(event.id)) {
      this.seenEvents.add(event.id);
      this.events = utils.insertEventIntoDescendingList(Array.from(this.events), event);
      this.onEvent.next(event);
      return true;
    }
    return false;
  }

  getLastEvent(nth = 0, filter?: EventFilter) {
    const events = filter ? this.events.filter(filter) : this.events;
    for (let i = nth; i >= 0; i--) {
      const event = events[events.length - 1 - i];
      if (event) return event;
    }
  }
}

export class TimelineLoader {
  cursor = dayjs().unix();
  query?: NostrRequestFilter;
  relays: string[] = [];

  events = new PersistentSubject<NostrEvent[]>([]);
  timeline = new PersistentSubject<NostrEvent[]>([]);
  loading = new PersistentSubject(false);
  complete = new PersistentSubject(false);

  loadNextBlockBuffer = 2;
  eventFilter?: (event: NostrEvent) => boolean;

  private subscription: NostrMultiSubscription;

  private relayTimelineLoaders = new Map<string, RelayTimelineLoader>();

  constructor(name?: string) {
    this.subscription = new NostrMultiSubscription([], undefined, name);
    this.subscription.onEvent.subscribe(this.handleEvent, this);
  }

  private seenEvents = new Set<string>();
  private handleEvent(event: NostrEvent) {
    if (!this.seenEvents.has(event.id)) {
      this.seenEvents.add(event.id);
      this.events.next(utils.insertEventIntoDescendingList(Array.from(this.events.value), event));

      if (!this.eventFilter || this.eventFilter(event)) {
        this.timeline.next(utils.insertEventIntoDescendingList(Array.from(this.timeline.value), event));
      }
    }
  }

  private createLoaders() {
    if (!this.query) return;

    for (const relay of this.relays) {
      if (!this.relayTimelineLoaders.has(relay)) {
        const loader = new RelayTimelineLoader(relay, this.query, this.subscription.name);
        this.relayTimelineLoaders.set(relay, loader);
        loader.onEvent.subscribe(this.handleEvent, this);
        loader.onBlockFinish.subscribe(this.updateLoading, this);
        loader.onBlockFinish.subscribe(this.updateComplete, this);
      }
    }
  }
  private removeLoaders(filter?: (loader: RelayTimelineLoader) => boolean) {
    for (const [relay, loader] of this.relayTimelineLoaders) {
      if (!filter || filter(loader)) {
        loader?.onEvent.unsubscribe(this.handleEvent, this);
        loader?.onBlockFinish.unsubscribe(this.updateLoading, this);
        loader?.onBlockFinish.unsubscribe(this.updateComplete, this);
        this.relayTimelineLoaders.delete(relay);
      }
    }
  }

  setRelays(relays: string[]) {
    if (this.relays.sort().join("|") === relays.sort().join("|")) return;

    // remove loaders
    this.removeLoaders((loader) => !relays.includes(loader.relay));

    this.relays = relays;
    this.createLoaders();

    this.subscription.setRelays(relays);
    this.updateComplete();
  }
  setQuery(query: NostrRequestFilter) {
    if (JSON.stringify(this.query) === JSON.stringify(query)) return;

    this.removeLoaders();

    this.query = query;
    this.events.next([]);
    this.timeline.next([]);
    this.seenEvents.clear();

    this.createLoaders();
    this.updateComplete();

    // update the subscription
    this.subscription.forgetEvents();
    this.subscription.setQuery(addToQuery(query, { limit: BLOCK_SIZE / 2 }));
  }
  setFilter(filter?: (event: NostrEvent) => boolean) {
    this.eventFilter = filter;
    if (this.eventFilter) {
      this.timeline.next(this.events.value.filter(this.eventFilter));
    }
  }

  setCursor(cursor: number) {
    this.cursor = cursor;
    this.loadNextBlocks();
  }

  loadNextBlocks() {
    let triggeredLoad = false;
    for (const [relay, loader] of this.relayTimelineLoaders) {
      if (loader.complete || loader.loading) continue;
      const event = loader.getLastEvent(this.loadNextBlockBuffer, this.eventFilter);
      if (!event || event.created_at >= this.cursor) {
        loader.loadNextBlock();
        triggeredLoad = true;
      }
    }
    if (triggeredLoad) this.updateLoading();
  }
  /** @deprecated */
  loadMore() {
    for (const [relay, loader] of this.relayTimelineLoaders) {
      if (loader.complete || loader.loading) continue;
      loader.loadNextBlock();
    }
  }

  private updateLoading() {
    for (const [relay, loader] of this.relayTimelineLoaders) {
      if (loader.loading) {
        if (!this.loading.value) {
          this.loading.next(true);
          return;
        }
      }
    }
    if (this.loading.value) this.loading.next(false);
  }
  private updateComplete() {
    for (const [relay, loader] of this.relayTimelineLoaders) {
      if (!loader.complete) {
        this.complete.next(false);
        return;
      }
    }
    return this.complete.next(true);
  }
  open() {
    this.subscription.open();
  }
  close() {
    this.subscription.close();
  }

  reset() {
    this.cursor = dayjs().unix();
    this.relayTimelineLoaders.clear();
    this.forgetEvents();
  }

  // TODO: this is only needed because the current logic dose not remove events when the relay they where fetched from is removed
  /** @deprecated */
  forgetEvents() {
    this.events.next([]);
    this.timeline.next([]);
    this.seenEvents.clear();
    this.subscription.forgetEvents();
  }
}
