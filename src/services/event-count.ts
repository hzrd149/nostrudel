import stringify from "json-stringify-deterministic";
import Subject from "../classes/subject";
import SuperMap from "../classes/super-map";
import { NostrRequestFilter } from "../types/nostr-query";
import NostrRequest from "../classes/nostr-request";

// TODO: move this to settings
const COUNT_RELAY = "wss://relay.nostr.band";

class EventCountService {
  subjects = new SuperMap<string, Subject<number>>(() => new Subject<number>());

  stringifyFilter(filter: NostrRequestFilter) {
    return stringify(filter);
  }

  requestCount(filter: NostrRequestFilter, alwaysRequest = false) {
    const key = this.stringifyFilter(filter);
    const sub = this.subjects.get(key);

    if (sub.value === undefined || alwaysRequest) {
      const request = new NostrRequest([COUNT_RELAY]);
      request.onCount.subscribe((c) => sub.next(c.count));
      request.start(filter, "COUNT");
    }

    return sub;
  }

  getCount(filter: NostrRequestFilter) {
    const key = this.stringifyFilter(filter);
    const sub = this.subjects.get(key);
    return sub;
  }
}

const eventCountService = new EventCountService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.eventCountService = eventCountService;
}

export default eventCountService;
