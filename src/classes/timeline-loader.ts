import dayjs from "dayjs";
import { Debugger } from "debug";
import { NostrEvent } from "../types/nostr-event";
import { NostrQuery, NostrRequestFilter } from "../types/nostr-query";
import { NostrRequest } from "./nostr-request";
import { NostrMultiSubscription } from "./nostr-multi-subscription";
import Subject, { PersistentSubject } from "./subject";
import { logger } from "../helpers/debug";
import EventStore from "./event-store";
import { isReplaceable } from "../helpers/nostr/events";
import replaceableEventLoaderService from "../services/replaceable-event-requester";

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
  private log: Debugger;

  loading = false;
  events: EventStore;
  /** set to true when the next block produces 0 events */
  complete = false;

  onBlockFinish = new Subject<void>();

  constructor(relay: string, query: NostrRequestFilter, name: string, log?: Debugger) {
    this.relay = relay;
    this.query = query;
    this.name = name;

    this.log = log || logger.extend(this.name);
    this.events = new EventStore(relay);
  }

  loadNextBlock() {
    this.loading = true;
    let query: NostrRequestFilter = addToQuery(this.query, { limit: this.blockSize });
    let oldestEvent = this.getLastEvent();
    if (oldestEvent) {
      query = addToQuery(query, { until: oldestEvent.created_at - 1 });
    }

    const request = new NostrRequest([this.relay], 20 * 1000);

    let gotEvents = 0;
    request.onEvent.subscribe((e) => {
      this.handleEvent(e);
      gotEvents++;
    });
    request.onComplete.then(() => {
      this.loading = false;
      this.log(`Got ${gotEvents} events`);
      if (gotEvents === 0) {
        this.complete = true;
        this.log("Complete");
      }
      this.onBlockFinish.next();
    });

    request.start(query);
  }

  private handleEvent(event: NostrEvent) {
    return this.events.addEvent(event);
  }

  getLastEvent(nth = 0) {
    return this.events.getLastEvent(nth);
  }
}

export class TimelineLoader {
  cursor = dayjs().unix();
  query?: NostrRequestFilter;
  relays: string[] = [];

  events: EventStore;
  timeline = new PersistentSubject<NostrEvent[]>([]);
  loading = new PersistentSubject(false);
  complete = new PersistentSubject(false);

  loadNextBlockBuffer = 2;
  eventFilter?: (event: NostrEvent) => boolean;

  name: string;
  private log: Debugger;
  private subscription: NostrMultiSubscription;

  private relayTimelineLoaders = new Map<string, RelayTimelineLoader>();

  constructor(name: string) {
    this.name = name;
    this.log = logger.extend("TimelineLoader:" + name);
    this.events = new EventStore(name);

    this.subscription = new NostrMultiSubscription([], undefined, name);
    this.subscription.onEvent.subscribe(this.handleEvent, this);

    // update the timeline when there are new events
    this.events.onEvent.subscribe(this.updateTimeline, this);
    this.events.onClear.subscribe(this.updateTimeline, this);
  }

  private updateTimeline() {
    if (this.eventFilter) {
      this.timeline.next(this.events.getSortedEvents().filter(this.eventFilter));
    } else this.timeline.next(this.events.getSortedEvents());
  }
  private handleEvent(event: NostrEvent) {
    // if this is a replaceable event, mirror it over to the replaceable event service
    if (isReplaceable(event.kind)) {
      replaceableEventLoaderService.handleEvent(event);
    }
    this.events.addEvent(event);
  }

  private createLoaders() {
    if (!this.query) return;

    for (const relay of this.relays) {
      if (!this.relayTimelineLoaders.has(relay)) {
        const loader = new RelayTimelineLoader(relay, this.query, this.name, this.log.extend(relay));
        this.relayTimelineLoaders.set(relay, loader);
        this.events.connect(loader.events);
        loader.onBlockFinish.subscribe(this.updateLoading, this);
        loader.onBlockFinish.subscribe(this.updateComplete, this);
      }
    }
  }
  private removeLoaders(filter?: (loader: RelayTimelineLoader) => boolean) {
    for (const [relay, loader] of this.relayTimelineLoaders) {
      if (!filter || filter(loader)) {
        this.events.disconnect(loader.events);
        loader.onBlockFinish.unsubscribe(this.updateLoading, this);
        loader.onBlockFinish.unsubscribe(this.updateComplete, this);
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

    this.log("set query", query);
    this.query = query;
    this.events.clear();
    this.timeline.next([]);

    this.createLoaders();
    this.updateComplete();

    // update the subscription
    this.subscription.forgetEvents();
    this.subscription.setQuery(addToQuery(query, { limit: BLOCK_SIZE / 2 }));
  }
  setFilter(filter?: (event: NostrEvent) => boolean) {
    this.eventFilter = filter;
    this.updateTimeline();
  }

  setCursor(cursor: number) {
    this.cursor = cursor;
    this.loadNextBlocks();
  }

  loadNextBlocks() {
    let triggeredLoad = false;
    for (const [relay, loader] of this.relayTimelineLoaders) {
      if (loader.complete || loader.loading) continue;
      const event = loader.getLastEvent(this.loadNextBlockBuffer);
      if (!event || event.created_at >= this.cursor) {
        loader.loadNextBlock();
        triggeredLoad = true;
      }
    }
    if (triggeredLoad) this.updateLoading();
  }
  /** @deprecated */
  loadMore() {
    let triggeredLoad = false;
    for (const [relay, loader] of this.relayTimelineLoaders) {
      if (loader.complete || loader.loading) continue;
      loader.loadNextBlock();
      triggeredLoad = true;
    }
    if (triggeredLoad) this.updateLoading();
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
    this.events.clear();
    this.timeline.next([]);
    this.subscription.forgetEvents();
  }
}
