import { Filter } from "nostr-tools";
import stringify from "json-stringify-deterministic";
import { BehaviorSubject } from "rxjs";

import SuperMap from "../classes/super-map";
import { getCacheRelay } from "./cache-relay";

class EventCountService {
  subjects = new SuperMap<string, BehaviorSubject<number | undefined>>(
    () => new BehaviorSubject<number | undefined>(undefined),
  );

  stringifyFilter(filter: Filter | Filter[]) {
    return stringify(filter);
  }

  requestCount(filter: Filter | Filter[], alwaysRequest = false) {
    const key = this.stringifyFilter(filter);
    const sub = this.subjects.get(key);

    if (sub.value === undefined || alwaysRequest) {
      // try to get a count from the local relay
      getCacheRelay()
        ?.count(Array.isArray(filter) ? filter : [filter], {})
        .then((count) => {
          if (Number.isFinite(count)) sub.next(count);
        });
    }

    return sub;
  }

  getCount(filter: Filter | Filter[]) {
    const key = this.stringifyFilter(filter);
    const sub = this.subjects.get(key);
    return sub;
  }
}

const eventCountService = new EventCountService();

if (import.meta.env.DEV) {
  // @ts-expect-error debug
  window.eventCountService = eventCountService;
}

export default eventCountService;
