import { TimelineLoader } from "../classes/timeline-loader";

const MAX_CACHE = 4;

class TimelineCacheService {
  private timelines = new Map<string, TimelineLoader>();
  private cacheQueue: string[] = [];

  createTimeline(key: string) {
    let timeline = this.timelines.get(key);
    if (!timeline) {
      timeline = new TimelineLoader(key);
      this.timelines.set(key, timeline);
    }

    this.cacheQueue = this.cacheQueue.filter((p) => p !== key).concat(key);
    while (this.cacheQueue.length > MAX_CACHE) {
      this.cacheQueue.shift();
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
