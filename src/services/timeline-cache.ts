import { defined } from "applesauce-core";
import { createOutboxMap, getProfilePointersFromList, LRU } from "applesauce-core/helpers";
import { TimelessFilter } from "applesauce-loaders";
import {
  createOutboxTimelineLoader,
  createTimelineLoader,
  LoadableAddressPointer,
  TimelineLoader,
} from "applesauce-loaders/loaders";
import hash_sum from "hash-sum";
import { map, tap } from "rxjs";

import { logger } from "../helpers/debug";
import { outboxSelection } from "../models/outbox-selection";
import { cacheRequest } from "./event-cache";
import { eventStore } from "./event-store";
import pool from "./pool";

const MAX_CACHE = 30;
const BATCH_LIMIT = 100;

class TimelineCacheService {
  protected timelines = new LRU<TimelineLoader>(MAX_CACHE);
  protected log = logger.extend("TimelineCacheService");

  // Get or create a new timeline for a list of relays and filters
  createTimeline(key: string, relays: string[], filters: TimelessFilter[]): TimelineLoader {
    let timeline = this.timelines.get(key);

    if (!timeline) {
      if (relays.length === 0 || filters.length === 0) throw new Error("Relays and filters are required");

      this.log(`Creating ${key}`);
      timeline = createTimelineLoader(pool, relays, filters, {
        limit: BATCH_LIMIT,
        cache: cacheRequest,
        eventStore,
      });
      this.timelines.set(key, timeline);
    }

    return timeline;
  }

  // Get or create a new outbox timeline for a list
  createOutboxTimeline(list: LoadableAddressPointer, filter: TimelessFilter): TimelineLoader {
    // Create a cache key for the args
    const key = hash_sum(["outbox", list.kind, list.pubkey, list.identifier, filter]);

    // Return the existing timeline if it exists
    let existing = this.timelines.get(key);
    if (existing) return existing;

    this.log(`Creating outbox timeline for ${list.kind}:${list.pubkey}:${list.identifier} with filter`, filter);

    // Create an observable for the outbox map for the list
    const outboxMap$ = eventStore.replaceable(list).pipe(
      // Get users from the list
      map((event) => (event ? getProfilePointersFromList(event) : undefined)),
      // Filter out undefined
      defined(),
      // Select outboxes for users
      outboxSelection(),
      // Log timeline changes
      tap(() => this.log(`Updating outbox map for ${list.kind}:${list.pubkey}:${list.identifier}`)),
      // Group outboxes by relay
      map((selection) => createOutboxMap(selection)),
    );

    // Create a new outbox timeline
    const loader = createOutboxTimelineLoader(pool, outboxMap$, filter, {
      eventStore,
      limit: BATCH_LIMIT,
      cache: cacheRequest,
    });
    this.timelines.set(key, loader);
    return loader;
  }
}

const timelineCacheService = new TimelineCacheService();

if (import.meta.env.DEV) {
  //@ts-ignore
  window.timelineCacheService = timelineCacheService;
}

export default timelineCacheService;
