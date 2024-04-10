import dayjs from "dayjs";
import { Debugger } from "debug";
import { Filter, NostrEvent } from "nostr-tools";
import _throttle from "lodash.throttle";

import { RelayQueryMap } from "../types/nostr-relay";
import NostrMultiSubscription from "./nostr-multi-subscription";
import { PersistentSubject } from "./subject";
import { logger } from "../helpers/debug";
import EventStore from "./event-store";
import { isReplaceable } from "../helpers/nostr/event";
import replaceableEventsService from "../services/replaceable-events";
import { mergeFilter, isFilterEqual, isQueryMapEqual, mapQueryMap, stringifyFilter } from "../helpers/nostr/filter";
import { localRelay } from "../services/local-relay";
import { relayRequest } from "../helpers/relay";
import SuperMap from "./super-map";
import ChunkedRequest from "./chunked-request";
import relayPoolService from "../services/relay-pool";

const BLOCK_SIZE = 100;

export type EventFilter = (event: NostrEvent, store: EventStore) => boolean;

export default class TimelineLoader {
  cursor = dayjs().unix();
  queryMap: RelayQueryMap = {};

  events: EventStore;
  timeline = new PersistentSubject<NostrEvent[]>([]);
  loading = new PersistentSubject(false);
  complete = new PersistentSubject(false);

  loadNextBlockBuffer = 2;
  eventFilter?: EventFilter;

  name: string;
  private log: Debugger;
  private subscription: NostrMultiSubscription;

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
    if (cache) localRelay.publish(event);
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

  private loadQueriesFromCache(queryMap: RelayQueryMap) {
    const queries: Record<string, Filter[]> = {};
    for (const [url, filters] of Object.entries(queryMap)) {
      const key = stringifyFilter(filters);
      if (!queries[key]) queries[key] = Array.isArray(filters) ? filters : [filters];
    }

    for (const filters of Object.values(queries)) {
      relayRequest(localRelay, filters).then((events) => {
        for (const e of events) this.handleEvent(e, false);
      });
    }
  }

  setQueryMap(queryMap: RelayQueryMap) {
    if (isQueryMapEqual(this.queryMap, queryMap)) return;

    this.log("set query map", queryMap);

    // remove relays
    for (const relay of Object.keys(this.queryMap)) {
      const loader = this.chunkLoaders.get(relay);
      if (!loader) continue;
      if (!queryMap[relay]) {
        this.disconnectToChunkLoader(loader);
        this.chunkLoaders.delete(relay);
      }
    }

    for (const [relay, filter] of Object.entries(queryMap)) {
      // remove outdated loaders
      if (this.queryMap[relay] && !isFilterEqual(this.queryMap[relay], filter)) {
        const old = this.chunkLoaders.get(relay)!;
        this.disconnectToChunkLoader(old);
        this.chunkLoaders.delete(relay);
      }

      if (!this.chunkLoaders.has(relay)) {
        const loader = new ChunkedRequest(
          relayPoolService.requestRelay(relay),
          Array.isArray(filter) ? filter : [filter],
          this.log.extend(relay),
        );
        this.chunkLoaders.set(relay, loader);
        this.connectToChunkLoader(loader);
      }
    }

    this.queryMap = queryMap;

    // load all filters from cache relay
    this.loadQueriesFromCache(queryMap);

    // update the subscription query map and add limit
    this.subscription.setQueryMap(
      mapQueryMap(this.queryMap, (filter) => mergeFilter(filter, { limit: BLOCK_SIZE / 2 })),
    );

    this.triggerChunkLoad();
  }

  setEventFilter(filter?: EventFilter) {
    this.eventFilter = filter;
    this.updateTimeline();
  }
  setCursor(cursor: number) {
    this.cursor = cursor;
    this.triggerChunkLoad();
  }

  triggerChunkLoad() {
    let triggeredLoad = false;
    for (const [relay, loader] of this.chunkLoaders) {
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
    for (const [relay, loader] of this.chunkLoaders) {
      if (loader.complete || loader.loading) continue;
      loader.loadNextChunk();
      triggeredLoad = true;
    }
    if (triggeredLoad) this.updateLoading();
  }

  private updateLoading() {
    for (const [relay, loader] of this.chunkLoaders) {
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
    for (const [relay, loader] of this.chunkLoaders) {
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
    for (const [_, loader] of this.chunkLoaders) this.disconnectToChunkLoader(loader);
    this.chunkLoaders.clear();
    this.forgetEvents();
  }

  /** close the subscription and remove any event listeners for this timeline */
  cleanup() {
    this.close();

    for (const [_, loader] of this.chunkLoaders) this.disconnectToChunkLoader(loader);
    this.chunkLoaders.clear();

    this.events.cleanup();
  }
}
