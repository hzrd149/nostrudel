import _throttle from "lodash.throttle";

import { NostrRequest } from "../classes/nostr-request";
import Subject from "../classes/subject";
import { SuperMap } from "../classes/super-map";
import { safeRelayUrls } from "../helpers/url";
import { NostrEvent } from "../types/nostr-event";

class SingleEventService {
  private cache = new SuperMap<string, Subject<NostrEvent>>(() => new Subject());
  pending = new Map<string, string[]>();

  requestEvent(id: string, relays: string[]) {
    const subject = this.cache.get(id);
    if (subject.value) return subject;

    this.pending.set(id, this.pending.get(id)?.concat(safeRelayUrls(relays)) ?? safeRelayUrls(relays));
    this.batchRequestsThrottle();

    return subject;
  }

  handleEvent(event: NostrEvent) {
    this.cache.get(event.id).next(event);
  }

  private batchRequestsThrottle = _throttle(this.batchRequests, 1000 * 2);
  batchRequests() {
    if (this.pending.size === 0) return;

    const idsFromRelays: Record<string, string[]> = {};
    for (const [id, relays] of this.pending) {
      for (const relay of relays) {
        idsFromRelays[relay] = idsFromRelays[relay] ?? [];
        idsFromRelays[relay].push(id);
      }
    }

    for (const [relay, ids] of Object.entries(idsFromRelays)) {
      const request = new NostrRequest([relay]);
      request.onEvent.subscribe(this.handleEvent, this);
      request.start({ ids });
    }
    this.pending.clear();
  }
}

const singleEventService = new SingleEventService();

export default singleEventService;
