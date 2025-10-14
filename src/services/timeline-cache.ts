import { LRU } from "applesauce-core/helpers";
import { TimelessFilter } from "applesauce-loaders";
import { createTimelineLoader, TimelineLoader } from "applesauce-loaders/loaders";

import { logger } from "../helpers/debug";
import { cacheRequest } from "./event-cache";
import { eventStore } from "./event-store";
import pool from "./pool";

const MAX_CACHE = 30;
const BATCH_LIMIT = 100;

class TimelineCacheService {
  protected timelines = new LRU<TimelineLoader>(MAX_CACHE);
  protected log = logger.extend("TimelineCacheService");

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
}

const timelineCacheService = new TimelineCacheService();

if (import.meta.env.DEV) {
  //@ts-ignore
  window.timelineCacheService = timelineCacheService;
}

export default timelineCacheService;
