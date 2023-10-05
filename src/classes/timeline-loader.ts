import dayjs from "dayjs";
import { Debugger } from "debug";
import { NostrEvent, isATag, isETag } from "../types/nostr-event";
import { NostrQuery, NostrRequestFilter } from "../types/nostr-query";
import NostrRequest from "./nostr-request";
import NostrMultiSubscription from "./nostr-multi-subscription";
import Subject, { PersistentSubject } from "./subject";
import { logger } from "../helpers/debug";
import EventStore from "./event-store";
import { isReplaceable } from "../helpers/nostr/events";
import replaceableEventLoaderService from "../services/replaceable-event-requester";
import deleteEventService from "../services/delete-events";

function addToQuery(filter: NostrRequestFilter, query: NostrQuery) {
  if (Array.isArray(filter)) {
    return filter.map((f) => ({ ...f, ...query }));
  }
  return { ...filter, ...query };
}

const BLOCK_SIZE = 30;

export type EventFilter = (event: NostrEvent) => boolean;

export class RelayTimelineLoader {
  relay: string;
  query: NostrRequestFilter;
  blockSize = BLOCK_SIZE;
  private log: Debugger;

  loading = false;
  events: EventStore;
  /** set to true when the next block produces 0 events */
  complete = false;

  onBlockFinish = new Subject<void>();

  constructor(relay: string, query: NostrRequestFilter, log?: Debugger) {
    this.relay = relay;
    this.query = query;

    this.log = log || logger.extend(relay);
    this.events = new EventStore(relay);

    deleteEventService.stream.subscribe(this.handleDeleteEvent, this);
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

  private handleDeleteEvent(deleteEvent: NostrEvent) {
    const cord = deleteEvent.tags.find(isATag)?.[1];
    const eventId = deleteEvent.tags.find(isETag)?.[1];

    if (cord) this.events.deleteEvent(cord);
    if (eventId) this.events.deleteEvent(eventId);
  }

  private handleEvent(event: NostrEvent) {
    return this.events.addEvent(event);
  }

  cleanup() {
    deleteEventService.stream.unsubscribe(this.handleDeleteEvent, this);
  }

  getFirstEvent(nth = 0, filter?: EventFilter) {
    return this.events.getFirstEvent(nth, filter);
  }
  getLastEvent(nth = 0, filter?: EventFilter) {
    return this.events.getLastEvent(nth, filter);
  }
}

export default class TimelineLoader {
  cursor = dayjs().unix();
  query?: NostrRequestFilter;
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

  relayTimelineLoaders = new Map<string, RelayTimelineLoader>();

  constructor(name: string) {
    this.name = name;
    this.log = logger.extend("TimelineLoader:" + name);
    this.events = new EventStore(name);

    this.subscription = new NostrMultiSubscription([], undefined, name);
    this.subscription.onEvent.subscribe(this.handleEvent, this);

    // update the timeline when there are new events
    this.events.onEvent.subscribe(this.updateTimeline, this);
    this.events.onDelete.subscribe(this.updateTimeline, this);
    this.events.onClear.subscribe(this.updateTimeline, this);

    deleteEventService.stream.subscribe(this.handleDeleteEvent, this);
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
  private handleDeleteEvent(deleteEvent: NostrEvent) {
    const cord = deleteEvent.tags.find(isATag)?.[1];
    const eventId = deleteEvent.tags.find(isETag)?.[1];

    if (cord) this.events.deleteEvent(cord);
    if (eventId) this.events.deleteEvent(eventId);
  }

  private createLoaders() {
    if (!this.query) return;

    for (const relay of this.relays) {
      if (!this.relayTimelineLoaders.has(relay)) {
        const loader = new RelayTimelineLoader(relay, this.query, this.log.extend(relay));
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
        loader.cleanup();
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

    // remove all loaders
    this.removeLoaders();

    this.log("set query", query);
    this.query = query;

    // forget all events
    this.forgetEvents();
    // create any missing loaders
    this.createLoaders();
    // update the complete flag
    this.updateComplete();
    // update the subscription with the new query
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
    this.removeLoaders();
    this.forgetEvents();
  }

  /** close the subscription and remove any event listeners for this timeline */
  cleanup() {
    this.close();
    this.removeLoaders();
    deleteEventService.stream.unsubscribe(this.handleDeleteEvent, this);
  }

  // TODO: this is only needed because the current logic dose not remove events when the relay they where fetched from is removed
  /** @deprecated */
  forgetEvents() {
    this.events.clear();
    this.timeline.next([]);
    this.subscription.forgetEvents();
  }
}
