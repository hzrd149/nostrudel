import dayjs from "dayjs";
import { Debugger } from "debug";
import { AbstractRelay, Filter, NostrEvent } from "nostr-tools";
import _throttle from "lodash.throttle";

import MultiSubscription from "./multi-subscription";
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
import Process from "./process";
import AlignHorizontalCentre02 from "../components/icons/align-horizontal-centre-02";
import processManager from "../services/process-manager";

const BLOCK_SIZE = 100;

export type EventFilter = (event: NostrEvent, store: EventStore) => boolean;

export default class TimelineLoader {
  cursor = dayjs().unix();
  filters: Filter[] = [];
  relays: AbstractRelay[] = [];

  events: EventStore;
  timeline = new PersistentSubject<NostrEvent[]>([]);
  loading = new PersistentSubject(false);
  complete = new PersistentSubject(false);

  loadNextBlockBuffer = 2;
  eventFilter?: EventFilter;

  name: string;
  process: Process;
  private log: Debugger;
  private subscription: MultiSubscription;

  private cacheLoader: ChunkedRequest | null = null;
  private loaders = new Map<string, ChunkedRequest>();

  constructor(name: string) {
    this.name = name;
    this.process = new Process("TimelineLoader", this);
    this.process.name = name;
    this.process.icon = AlignHorizontalCentre02;

    this.log = logger.extend("TimelineLoader:" + name);
    this.events = new EventStore(name);
    this.events.connect(replaceableEventsService.events, false);

    this.subscription = new MultiSubscription(name);
    this.subscription.onEvent.subscribe(this.handleEvent.bind(this));
    this.subscription.onCacheEvent.subscribe((event) => this.handleEvent(event, true));
    this.process.addChild(this.subscription.process);

    // update the timeline when there are new events
    this.events.onEvent.subscribe(this.throttleUpdateTimeline.bind(this));
    this.events.onDelete.subscribe(this.throttleUpdateTimeline.bind(this));
    this.events.onClear.subscribe(this.throttleUpdateTimeline.bind(this));

    processManager.registerProcess(this.process);
  }

  private throttleUpdateTimeline = _throttle(this.updateTimeline, 10);
  private updateTimeline() {
    if (this.eventFilter) {
      const filter = this.eventFilter;
      this.timeline.next(this.events.getSortedEvents().filter((e) => filter(e, this.events)));
    } else this.timeline.next(this.events.getSortedEvents());
  }

  private seenInCache = new Set<string>();
  private handleEvent(event: NostrEvent, fromCache = false) {
    // if this is a replaceable event, mirror it over to the replaceable event service
    if (isReplaceable(event.kind)) replaceableEventsService.handleEvent(event);

    this.events.addEvent(event);
    if (!fromCache && localRelay && !this.seenInCache.has(event.id)) localRelay.publish(event);

    if (fromCache) this.seenInCache.add(event.id);
  }
  private handleChunkFinished() {
    this.updateLoading();
    this.updateComplete();
  }

  private chunkLoaderSubs = new SuperMap<ChunkedRequest, ZenObservable.Subscription[]>(() => []);
  private connectToChunkLoader(loader: ChunkedRequest) {
    this.process.addChild(loader.process);

    this.events.connect(loader.events);
    const subs = this.chunkLoaderSubs.get(loader);
    subs.push(loader.onChunkFinish.subscribe(this.handleChunkFinished.bind(this)));
  }
  private disconnectFromChunkLoader(loader: ChunkedRequest) {
    loader.destroy();
    this.events.disconnect(loader.events);
    const subs = this.chunkLoaderSubs.get(loader);
    for (const sub of subs) sub.unsubscribe();
    this.chunkLoaderSubs.delete(loader);
  }

  setFilters(filters: Filter[]) {
    if (isFilterEqual(this.filters, filters)) return;

    this.log("Set filters", filters);

    // recreate all chunk loaders
    for (const relay of this.relays) {
      const loader = this.loaders.get(relay.url);
      if (loader) {
        this.disconnectFromChunkLoader(loader);
        this.loaders.delete(relay.url);
      }

      const chunkLoader = new ChunkedRequest(
        relayPoolService.requestRelay(relay.url),
        filters,
        this.log.extend(relay.url),
      );
      this.loaders.set(relay.url, chunkLoader);
      this.connectToChunkLoader(chunkLoader);
    }

    // set filters
    this.filters = filters;

    // recreate cache chunk loader
    if (this.cacheLoader) this.disconnectFromChunkLoader(this.cacheLoader);
    if (localRelay) {
      this.cacheLoader = new ChunkedRequest(localRelay, this.filters, this.log.extend("cache-relay"));
      this.connectToChunkLoader(this.cacheLoader);
    }

    // update the live subscription query map and add limit
    this.subscription.setFilters(mergeFilter(filters, { limit: BLOCK_SIZE / 2 }));
  }

  setRelays(relays: Iterable<string | URL | AbstractRelay>) {
    const newRelays = relayPoolService.getRelays(relays);

    // remove chunk loaders
    for (const relay of newRelays) {
      const loader = this.loaders.get(relay.url);
      if (!loader) continue;
      if (!this.relays.includes(relay)) {
        this.disconnectFromChunkLoader(loader);
        this.loaders.delete(relay.url);
      }
    }

    // create chunk loaders only if filters are set
    if (this.filters.length > 0) {
      for (const relay of newRelays) {
        if (!this.loaders.has(relay.url)) {
          const loader = new ChunkedRequest(relay, this.filters, this.log.extend(relay.url));
          this.loaders.set(relay.url, loader);
          this.connectToChunkLoader(loader);
        }
      }
    }

    this.relays = relayPoolService.getRelays(relays);
    this.process.relays = new Set(this.relays);

    // update live subscription
    this.subscription.setRelays(this.relays);
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
    return this.cacheLoader ? [...this.loaders.values(), this.cacheLoader] : Array.from(this.loaders.values());
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
    this.process.active = true;
    this.subscription.open();
  }
  close() {
    this.process.active = false;
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
    for (const loader of loaders) this.disconnectFromChunkLoader(loader);
    this.loaders.clear();
    this.cacheLoader = null;
    this.forgetEvents();
  }

  /** close the subscription and remove any event listeners for this timeline */
  destroy() {
    this.close();

    const loaders = this.getAllLoaders();
    for (const loader of loaders) this.disconnectFromChunkLoader(loader);
    this.loaders.clear();
    this.cacheLoader = null;

    this.subscription.destroy();

    this.events.cleanup();
    this.process.remove();
    processManager.unregisterProcess(this.process);
  }
}
