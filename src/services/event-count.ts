import { Filter } from "nostr-tools";
import stringify from "json-stringify-deterministic";

import Subject from "../classes/subject";
import SuperMap from "../classes/super-map";
import { localRelay } from "./local-relay";

class EventCountService {
  subjects = new SuperMap<string, Subject<number>>(() => new Subject<number>());

  stringifyFilter(filter: Filter | Filter[]) {
    return stringify(filter);
  }

  requestCount(filter: Filter | Filter[], alwaysRequest = false) {
    const key = this.stringifyFilter(filter);
    const sub = this.subjects.get(key);

    if (sub.value === undefined || alwaysRequest) {
      // try to get a count from the local relay
      localRelay?.count(Array.isArray(filter) ? filter : [filter], {}).then((count) => {
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
  // @ts-ignore
  window.eventCountService = eventCountService;
}

export default eventCountService;
