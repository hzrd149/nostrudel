import stringify from "json-stringify-deterministic";

import Subject from "../classes/subject";
import { NostrRequestFilter } from "../types/nostr-relay";
import SuperMap from "../classes/super-map";
import relayScoreboardService from "./relay-scoreboard";
import { logger } from "../helpers/debug";
import { matchFilter, matchFilters } from "nostr-tools";
import { NostrEvent } from "../types/nostr-event";
import { relayRequest } from "../helpers/relay";
import { localRelay } from "./local-relay";
import relayPoolService from "./relay-pool";

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
      const p = localRelay ? relayRequest(localRelay, Array.isArray(filter) ? filter : [filter]) : Promise.resolve([]);

      p.then((cached) => {
        if (cached.length > 0) {
          for (const e of cached) this.handleEvent(e, false);
        } else {
          for (const url of relays) {
            if (!asked.has(url) && !pending.has(url)) {
              pending.add(url);
            }
          }
        }
      });
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
        const subject = this.answers.get(key);
        const limitFilter = Array.isArray(filter) ? filter.map((f) => ({ ...f, limit: 1 })) : [{ ...filter, limit: 1 }];
        const subscription = relayPoolService.requestRelay(nextRelay).subscribe(limitFilter, {
          eoseTimeout: 500,
          onevent: () => {
            this.log("Found event for", filter);
            subject.next(true);
            this.pending.delete(key);
          },
          oneose: () => {
            if (subject.value === undefined && this.asked.get(key).size > this.pending.get(key).size) {
              this.log("Could not find event for", filter);
              subject.next(false);
            }
            subscription.close();
          },
        });
      })();
    }
  }

  handleEvent(event: NostrEvent, cache = true) {
    for (const [key, filter] of this.filters) {
      const doesMatch = Array.isArray(filter) ? matchFilters(filter, event) : matchFilter(filter, event);
      if (doesMatch && this.answers.get(key).value !== true) {
        this.answers.get(key).next(true);
      }
    }

    if (cache && localRelay) localRelay.publish(event);
  }
}

const eventExistsService = new EventExistsService();
setInterval(() => eventExistsService.nextRequests(), 1000);

if (import.meta.env.DEV) {
  // @ts-ignore
  window.eventExistsService = eventExistsService;
}

export default eventExistsService;
