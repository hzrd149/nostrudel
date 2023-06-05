import UserTimeline from "../classes/user-timeline";

const MAX_CACHE = 4;

class UserTimelineService {
  timelines = new Map<string, UserTimeline>();

  cacheQueue: string[] = [];

  getTimeline(pubkey: string) {
    let timeline = this.timelines.get(pubkey);
    if (!timeline) {
      timeline = new UserTimeline(pubkey);
      this.timelines.set(pubkey, timeline);
    }

    this.cacheQueue = this.cacheQueue.filter((p) => p !== pubkey).concat(pubkey);
    while (this.cacheQueue.length > MAX_CACHE) {
      this.cacheQueue.shift();
    }

    return timeline;
  }
}

const userTimelineService = new UserTimelineService();

if (import.meta.env.DEV) {
  //@ts-ignore
  window.userTimelineService = userTimelineService;
}

export default userTimelineService;
