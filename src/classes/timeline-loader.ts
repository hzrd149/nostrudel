import dayjs from "dayjs";
import { Debugger } from "debug";
import { Filter, NostrEvent } from "nostr-tools";
import _throttle from "lodash.throttle";

import NostrMultiSubscription from "./nostr-multi-subscription";
import { PersistentSubject } from "./subject";
import { logger } from "../helpers/debug";
import EventStore from "./event-store";
import { isReplaceable } from "../helpers/nostr/event";
import replaceableEventsService from "../services/replaceable-events";
import { mergeFilter, isFilterEqual } from "../helpers/nostr/filter";
import { localRelay } from "../services/local-relay";
import SuperMap from "./super-map";
import ChunkedRequest from "./chunked-request";
import relayPoolService from "../services/relay-pool";

const BLOCK_SIZE = 100;

export type EventFilter = (event: NostrEvent, store: EventStore) => boolean;

export default class TimelineLoader {
  cursor = dayjs().unix();
  filters: Filter[] = [];
  relays: string[] = [];

  events: EventStore;
  timeline = new PersistentSubject<NostrEvent[]>([]);
  loading = new PersistentSubject(false);
  complete = new PersistentSubject(false);

  loadNextBlockBuffer = 2;
  eventFilter?: EventFilter;

  name: string;
  private log: Debugger;
  private subscription: NostrMultiSubscription;

  private cacheChunkLoader: ChunkedRequest | null = null;
  private chunkLoaders = new Map<string, ChunkedRequest>();

  constructor(name: string) {
    this.name = name;
    this.log = logger.extend("TimelineLoader:" + name);
    this.events = new EventStore(name);
    this.events.connect(replaceableEventsService.events, false);

    this.subscription = new NostrMultiSubscription(name);
    this.subscription.onEvent.subscribe(this.handleEvent.bind(this));

    // update the timeline when there are new events
    this.events.onEvent.subscribe(this.throttleUpdateTimeline.bind(this));
    this.events.onDelete.subscribe(this.throttleUpdateTimeline.bind(this));
    this.events.onClear.subscribe(this.throttleUpdateTimeline.bind(this));
  }

  private throttleUpdateTimeline = _throttle(this.updateTimeline, 10);
  private updateTimeline() {
    if (this.eventFilter) {
      const filter = this.eventFilter;
      this.timeline.next(this.events.getSortedEvents().filter((e) => filter(e, this.events)));
    } else this.timeline.next(this.events.getSortedEvents());
  }
  private handleEvent(event: NostrEvent, cache = true) {
    // if this is a replaceable event, mirror it over to the replaceable event service
    if (isReplaceable(event.kind)) replaceableEventsService.handleEvent(event);

    this.events.addEvent(event);
    if (cache && localRelay) localRelay.publish(event);
  }
  private handleChunkFinished() {
    this.updateLoading();
    this.updateComplete();
  }

  private chunkLoaderSubs = new SuperMap<ChunkedRequest, ZenObservable.Subscription[]>(() => []);
  private connectToChunkLoader(loader: ChunkedRequest) {
    this.events.connect(loader.events);
    const subs = this.chunkLoaderSubs.get(loader);
    subs.push(loader.onChunkFinish.subscribe(this.handleChunkFinished.bind(this)));
  }
  private disconnectToChunkLoader(loader: ChunkedRequest) {
    loader.cleanup();
    this.events.disconnect(loader.events);
    const subs = this.chunkLoaderSubs.get(loader);
    for (const sub of subs) sub.unsubscribe();
    this.chunkLoaderSubs.delete(loader);
  }

  setFilters(filters: Filter[]) {
    if (isFilterEqual(this.filters, filters)) return;

    this.log("Set filters", filters);

    // recreate all chunk loaders
    for (const url of this.relays) {
      const loader = this.chunkLoaders.get(url);
      if (loader) {
        this.disconnectToChunkLoader(loader);
        this.chunkLoaders.delete(url);
      }

      const chunkLoader = new ChunkedRequest(relayPoolService.requestRelay(url), filters, this.log.extend(url));
      this.chunkLoaders.set(url, chunkLoader);
      this.connectToChunkLoader(chunkLoader);
    }

    // set filters
    this.filters = filters;

    // recreate cache chunk loader
    if (this.cacheChunkLoader) this.disconnectToChunkLoader(this.cacheChunkLoader);
    if (localRelay) {
      this.cacheChunkLoader = new ChunkedRequest(localRelay, this.filters, this.log.extend("local-relay"));
      this.connectToChunkLoader(this.cacheChunkLoader);
    }

    // update the live subscription query map and add limit
    this.subscription.setFilters(mergeFilter(filters, { limit: BLOCK_SIZE / 2 }));
  }

  setRelays(relays: Iterable<string>) {
    this.relays = Array.from(relays);

    // remove chunk loaders
    for (const url of relays) {
      const loader = this.chunkLoaders.get(url);
      if (!loader) continue;
      if (!this.relays.includes(url)) {
        this.disconnectToChunkLoader(loader);
        this.chunkLoaders.delete(url);
      }
    }

    // create chunk loaders only if filters are set
    if (this.filters.length > 0) {
      for (const url of relays) {
        if (!this.chunkLoaders.has(url)) {
          const loader = new ChunkedRequest(relayPoolService.requestRelay(url), this.filters, this.log.extend(url));
          this.chunkLoaders.set(url, loader);
          this.connectToChunkLoader(loader);
        }
      }
    }

    // update live subscription
    this.subscription.setRelays(relays);
  }

  setEventFilter(filter?: EventFilter) {
    this.eventFilter = filter;
    this.updateTimeline();
  }
  setCursor(cursor: number) {
    this.cursor = cursor;
    this.triggerChunkLoad();
  }

  private getAllLoaders() {
    return this.cacheChunkLoader
      ? [...this.chunkLoaders.values(), this.cacheChunkLoader]
      : Array.from(this.chunkLoaders.values());
  }

  triggerChunkLoad() {
    let triggeredLoad = false;
    const loaders = this.getAllLoaders();

    for (const loader of loaders) {
      // skip loader if its already loading or complete
      if (loader.complete || loader.loading) continue;

      const event = loader.getLastEvent(this.loadNextBlockBuffer, this.eventFilter);
      if (!event || event.created_at >= this.cursor) {
        loader.loadNextChunk();
        triggeredLoad = true;
      }
    }

    if (triggeredLoad) this.updateLoading();
  }
  loadAllNextChunks() {
    let triggeredLoad = false;
    const loaders = this.getAllLoaders();

    for (const loader of loaders) {
      // skip loader if its already loading or complete
      if (loader.complete || loader.loading) continue;

      loader.loadNextChunk();
      triggeredLoad = true;
    }

    if (triggeredLoad) this.updateLoading();
  }

  private updateLoading() {
    const loaders = this.getAllLoaders();

    for (const loader of loaders) {
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
    const loaders = this.getAllLoaders();

    for (const loader of loaders) {
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

  forgetEvents() {
    this.events.clear();
    this.timeline.next([]);
    this.subscription.forgetEvents();
  }
  reset() {
    this.cursor = dayjs().unix();
    const loaders = this.getAllLoaders();
    for (const loader of loaders) this.disconnectToChunkLoader(loader);
    this.chunkLoaders.clear();
    this.cacheChunkLoader = null;
    this.forgetEvents();
  }

  /** close the subscription and remove any event listeners for this timeline */
  cleanup() {
    this.close();

    const loaders = this.getAllLoaders();
    for (const loader of loaders) this.disconnectToChunkLoader(loader);
    this.chunkLoaders.clear();
    this.cacheChunkLoader = null;

    this.events.cleanup();
  }
}
