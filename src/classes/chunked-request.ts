import { Debugger } from "debug";
import { Filter, NostrEvent, matchFilters } from "nostr-tools";
import _throttle from "lodash.throttle";

import NostrRequest from "./nostr-request";
import Subject from "./subject";
import { logger } from "../helpers/debug";
import EventStore from "./event-store";
import deleteEventService from "../services/delete-events";
import { mergeFilter } from "../helpers/nostr/filter";
import { isATag, isETag } from "../types/nostr-event";

const DEFAULT_CHUNK_SIZE = 100;

export type EventFilter = (event: NostrEvent, store: EventStore) => boolean;

export default class ChunkedRequest {
  relay: string;
  filters: Filter[];
  chunkSize = DEFAULT_CHUNK_SIZE;
  private log: Debugger;
  private subs: ZenObservable.Subscription[] = [];

  loading = false;
  events: EventStore;
  /** set to true when the next chunk produces 0 events */
  complete = false;

  onChunkFinish = new Subject<number>();

  constructor(relay: string, filters: Filter[], log?: Debugger) {
    this.relay = relay;
    this.filters = filters;

    this.log = log || logger.extend(relay);
    this.events = new EventStore(relay);

    // TODO: find a better place for this
    this.subs.push(deleteEventService.stream.subscribe((e) => this.handleDeleteEvent(e)));
  }

  loadNextChunk() {
    this.loading = true;
    let filters: Filter[] = mergeFilter(this.filters, { limit: this.chunkSize });
    let oldestEvent = this.getLastEvent();
    if (oldestEvent) {
      filters = mergeFilter(filters, { until: oldestEvent.created_at - 1 });
    }

    const request = new NostrRequest([this.relay]);

    let gotEvents = 0;
    request.onEvent.subscribe((e) => {
      this.handleEvent(e);
      gotEvents++;
    });
    request.onComplete.then(() => {
      this.loading = false;
      if (gotEvents === 0) {
        this.complete = true;
        this.log("Complete");
      } else this.log(`Got ${gotEvents} events`);
      this.onChunkFinish.next(gotEvents);
    });

    request.start(filters);
  }

  private handleEvent(event: NostrEvent) {
    if (!matchFilters(this.filters, event)) return;
    return this.events.addEvent(event);
  }

  private handleDeleteEvent(deleteEvent: NostrEvent) {
    const cord = deleteEvent.tags.find(isATag)?.[1];
    const eventId = deleteEvent.tags.find(isETag)?.[1];

    if (cord) this.events.deleteEvent(cord);
    if (eventId) this.events.deleteEvent(eventId);
  }

  cleanup() {
    for (const sub of this.subs) sub.unsubscribe();
    this.subs = [];
  }

  getFirstEvent(nth = 0, eventFilter?: EventFilter) {
    return this.events.getFirstEvent(nth, eventFilter);
  }
  getLastEvent(nth = 0, eventFilter?: EventFilter) {
    return this.events.getLastEvent(nth, eventFilter);
  }
}
