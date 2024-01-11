import _throttle from "lodash.throttle";
import { SimpleSubscription } from "nostr-idb";

import NostrRequest from "../classes/nostr-request";
import Subject from "../classes/subject";
import SuperMap from "../classes/super-map";
import { safeRelayUrls } from "../helpers/url";
import { NostrEvent } from "../types/nostr-event";
import { localCacheRelay } from "./local-cache-relay";

const RELAY_REQUEST_BATCH_TIME = 500;

class SingleEventService {
  private cache = new SuperMap<string, Subject<NostrEvent>>(() => new Subject());
  pending = new Map<string, string[]>();

  requestEvent(id: string, relays: string[]) {
    const subject = this.cache.get(id);
    if (subject.value) return subject;

    const newUrls = safeRelayUrls(relays);
    this.pending.set(id, this.pending.get(id)?.concat(newUrls) ?? newUrls);
    this.batchRequestsThrottle();

    return subject;
  }

  handleEvent(event: NostrEvent, cache = true) {
    this.cache.get(event.id).next(event);

    if (cache) localCacheRelay.publish(event);
  }

  private batchRequestsThrottle = _throttle(this.batchRequests, RELAY_REQUEST_BATCH_TIME);
  batchRequests() {
    if (this.pending.size === 0) return;

    // load events from local cache relay
    const sub: SimpleSubscription = localCacheRelay.subscribe([{ ids: Array.from(this.pending.keys()) }], {
      onevent: (e) => this.handleEvent(e, false),
      oneose: () => sub.close(),
    });

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
