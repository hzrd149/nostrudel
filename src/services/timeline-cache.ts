import { TimelineLoader } from "../classes/timeline-loader";

const MAX_CACHE = 10;

class TimelineCacheService {
  private timelines = new Map<string, TimelineLoader>();
  private cacheQueue: string[] = [];

  createTimeline(key: string) {
    let timeline = this.timelines.get(key);
    if (!timeline) {
      timeline = new TimelineLoader(key);
      this.timelines.set(key, timeline);
    }

    // add or move the timelines key to the top of the queue
    this.cacheQueue = this.cacheQueue.filter((p) => p !== key).concat(key);

    // remove any timelines at the end of the queue
    while (this.cacheQueue.length > MAX_CACHE) {
      const deleteKey = this.cacheQueue.shift();
      if (!deleteKey) break;
      const deadTimeline = this.timelines.get(deleteKey);
      if (deadTimeline) {
        this.timelines.delete(deleteKey);
        deadTimeline.cleanup();
      }
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
