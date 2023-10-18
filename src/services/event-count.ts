import stringify from "json-stringify-deterministic";

import Subject from "../classes/subject";
import SuperMap from "../classes/super-map";
import { NostrRequestFilter } from "../types/nostr-query";
import NostrRequest from "../classes/nostr-request";
import relayPoolService from "./relay-pool";

// TODO: move this to settings
const COUNT_RELAY = "wss://relay.nostr.band";

const RATE_LIMIT = 10 / 1000;

class EventCountService {
  subjects = new SuperMap<string, Subject<number>>(() => new Subject<number>());

  constructor() {
    window.setInterval(this.makeRequest.bind(this), RATE_LIMIT);
    relayPoolService.addClaim(COUNT_RELAY, this);
  }

  stringifyFilter(filter: NostrRequestFilter) {
    return stringify(filter);
  }

  private queue: NostrRequestFilter[] = [];
  private queueKeys = new Set<string>();
  requestCount(filter: NostrRequestFilter, alwaysRequest = false) {
    const key = this.stringifyFilter(filter);
    const sub = this.subjects.get(key);

    if (sub.value === undefined || alwaysRequest) {
      if (!this.queueKeys.has(key)) {
        this.queue.push(filter);
        this.queueKeys.add(key);
      }
    }

    return sub;
  }

  getCount(filter: NostrRequestFilter) {
    const key = this.stringifyFilter(filter);
    const sub = this.subjects.get(key);
    return sub;
  }

  makeRequest() {
    const filter = this.queue.pop();
    if (!filter) return;

    const key = this.stringifyFilter(filter);
    this.queueKeys.delete(key);

    const sub = this.subjects.get(key);
    const request = new NostrRequest([COUNT_RELAY]);
    request.onCount.subscribe((c) => sub.next(c.count));
    request.start(filter, "COUNT");
  }
}

const eventCountService = new EventCountService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.eventCountService = eventCountService;
}

export default eventCountService;
