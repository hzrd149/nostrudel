import stringify from "json-stringify-deterministic";

import Subject from "../classes/subject";
import { NostrRequestFilter } from "../types/nostr-query";
import SuperMap from "../classes/super-map";
import NostrRequest from "../classes/nostr-request";
import relayScoreboardService from "./relay-scoreboard";
import { logger } from "../helpers/debug";
import { matchFilter, matchFilters } from "nostr-tools";
import { NostrEvent } from "../types/nostr-event";

function hashFilter(filter: NostrRequestFilter) {
  return stringify(filter);
}

class EventExistsService {
  log = logger.extend("EventExistsService");
  answers = new SuperMap<string, Subject<boolean>>(() => new Subject());
  private filters = new Map<string, NostrRequestFilter>();

  asked = new SuperMap<string, Set<string>>(() => new Set());
  pending = new SuperMap<string, Set<string>>(() => new Set());

  getExists(filter: NostrRequestFilter) {
    const key = hashFilter(filter);
    return this.answers.get(key);
  }

  requestExists(filter: NostrRequestFilter, relays: string[]) {
    const key = hashFilter(filter);
    const sub = this.answers.get(key);
    const asked = this.asked.get(key);
    const pending = this.pending.get(key);

    if (!this.filters.has(key)) this.filters.set(key, filter);

    if (sub.value !== true) {
      for (const url of relays) {
        if (!asked.has(url) && !pending.has(url)) {
          pending.add(url);
        }
      }
    }

    return sub;
  }

  nextRequests() {
    for (const [key, relays] of this.pending) {
      const filter = JSON.parse(key) as NostrRequestFilter;
      const nextRelay = relayScoreboardService.getRankedRelays(Array.from(relays))[0];

      if (!nextRelay) continue;
      relays.delete(nextRelay);

      (async () => {
        const sub = this.answers.get(key);
        const request = new NostrRequest([nextRelay], 500);
        const limitFilter = Array.isArray(filter) ? filter.map((f) => ({ ...f, limit: 1 })) : { ...filter, limit: 1 };
        request.start(limitFilter);
        request.onEvent.subscribe(() => {
          this.log("Found event for", filter);
          sub.next(true);
          this.pending.delete(key);
        });
        await request.onComplete;
        if (sub.value === undefined && this.asked.get(key).size > this.pending.get(key).size) {
          this.log("Could not find event for", filter);
          sub.next(false);
        }
      })();
    }
  }

  handleEvent(event: NostrEvent) {
    for (const [key, filter] of this.filters) {
      const doseMatch = Array.isArray(filter) ? matchFilters(filter, event) : matchFilter(filter, event);
      if (doseMatch && this.answers.get(key).value !== true) {
        this.answers.get(key).next(true);
      }
    }
  }
}

const eventExistsService = new EventExistsService();
setInterval(() => eventExistsService.nextRequests(), 1000);

if (import.meta.env.DEV) {
  // @ts-ignore
  window.eventExistsService = eventExistsService;
}

export default eventExistsService;
