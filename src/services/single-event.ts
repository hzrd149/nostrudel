import _throttle from "lodash.throttle";

import SuperMap from "../classes/super-map";
import { NostrEvent } from "../types/nostr-event";
import { localRelay } from "./local-relay";
import { relayRequest, safeRelayUrls } from "../helpers/relay";
import { logger } from "../helpers/debug";
import Subject from "../classes/subject";
import relayPoolService from "./relay-pool";

const RELAY_REQUEST_BATCH_TIME = 500;

class SingleEventService {
  private subjects = new SuperMap<string, Subject<NostrEvent>>(() => new Subject<NostrEvent>());
  pending = new Map<string, string[]>();
  log = logger.extend("SingleEvent");

  getSubject(id: string) {
    return this.subjects.get(id);
  }

  requestEvent(id: string, relays: Iterable<string>) {
    const subject = this.subjects.get(id);
    if (subject.value) return subject;

    const safeURLs = safeRelayUrls(Array.from(relays));

    this.pending.set(id, this.pending.get(id)?.concat(safeURLs) ?? safeURLs);
    this.batchRequestsThrottle();

    return subject;
  }

  handleEvent(event: NostrEvent, cache = true) {
    this.subjects.get(event.id).next(event);
    if (cache) localRelay.publish(event);
  }

  private batchRequestsThrottle = _throttle(this.batchRequests, RELAY_REQUEST_BATCH_TIME);
  async batchRequests() {
    if (this.pending.size === 0) return;

    const ids = Array.from(this.pending.keys());
    const loaded: string[] = [];

    // load from cache relay
    const fromCache = await relayRequest(localRelay, [{ ids }]);

    for (const e of fromCache) {
      this.handleEvent(e, false);
      loaded.push(e.id);
    }

    if (loaded.length > 0) this.log(`Loaded ${loaded.length} from cache instead of relays`);

    const idsFromRelays: Record<string, string[]> = {};
    for (const [id, relays] of this.pending) {
      if (loaded.includes(id)) continue;

      for (const relay of relays) {
        idsFromRelays[relay] = idsFromRelays[relay] ?? [];
        idsFromRelays[relay].push(id);
      }
    }

    for (const [relay, ids] of Object.entries(idsFromRelays)) {
      const sub = relayPoolService
        .requestRelay(relay)
        .subscribe([{ ids }], { onevent: (event) => this.handleEvent(event), oneose: () => sub.close() });
    }
    this.pending.clear();
  }
}

const singleEventService = new SingleEventService();

if (import.meta.env.DEV) {
  //@ts-expect-error
  window.singleEventService = singleEventService;
}

export default singleEventService;
