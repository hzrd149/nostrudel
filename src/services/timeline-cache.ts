import { LRU } from "applesauce-core/helpers";
import { TimelessFilter, TimelineLoader } from "applesauce-loaders";

import { nostrRequest } from "./rx-nostr";
import { logger } from "../helpers/debug";
import { cacheRequest } from "./cache-relay";

const MAX_CACHE = 30;
const BATCH_LIMIT = 100;

class TimelineCacheService {
  protected timelines = new LRU<TimelineLoader>(MAX_CACHE);
  protected log = logger.extend("TimelineCacheService");

  createTimeline(key: string, relays: string[], filters: TimelessFilter[]) {
    let timeline = this.timelines.get(key);

    if (!timeline && relays.length > 0 && filters.length > 0) {
      this.log(`Creating ${key}`);
      timeline = new TimelineLoader(nostrRequest, TimelineLoader.simpleFilterMap(relays, filters), {
        limit: BATCH_LIMIT,
        cacheRequest,
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
