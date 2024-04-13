import { Filter, kinds } from "nostr-tools";
import _throttle from "lodash.throttle";

import Subject from "../classes/subject";
import SuperMap from "../classes/super-map";
import { NostrEvent, isATag, isETag } from "../types/nostr-event";
import { relayRequest } from "../helpers/relay";
import { localRelay } from "./local-relay";
import relayPoolService from "./relay-pool";

type eventUID = string;
type relay = string;

class EventZapsService {
  subjects = new SuperMap<eventUID, Subject<NostrEvent[]>>(() => new Subject<NostrEvent[]>([]));
  pending = new SuperMap<eventUID, Set<relay>>(() => new Set());

  requestZaps(eventUID: eventUID, relays: Iterable<string>, alwaysRequest = true) {
    const subject = this.subjects.get(eventUID);

    if (!subject.value || alwaysRequest) {
      for (const relay of relays) {
        this.pending.get(eventUID).add(relay);
      }
    }
    this.throttleBatchRequest();

    return subject;
  }

  handleEvent(event: NostrEvent, cache = true) {
    if (event.kind !== kinds.Zap) return;
    const eventUID = event.tags.find(isETag)?.[1] ?? event.tags.find(isATag)?.[1];
    if (!eventUID) return;

    const subject = this.subjects.get(eventUID);
    if (!subject.value) {
      subject.next([event]);
    } else if (!subject.value.some((e) => e.id === event.id)) {
      subject.next([...subject.value, event]);
    }

    if (cache && localRelay) localRelay.publish(event);
  }

  throttleBatchRequest = _throttle(this.batchRequests, 2000);
  batchRequests() {
    if (this.pending.size === 0) return;

    // load events from cache
    const uids = Array.from(this.pending.keys());
    const ids = uids.filter((id) => !id.includes(":"));
    const cords = uids.filter((id) => id.includes(":"));
    const filters: Filter[] = [];
    if (ids.length > 0) filters.push({ "#e": ids, kinds: [kinds.Zap] });
    if (cords.length > 0) filters.push({ "#a": cords, kinds: [kinds.Zap] });
    if (filters.length > 0 && localRelay) {
      relayRequest(localRelay, filters).then((events) => events.forEach((e) => this.handleEvent(e, false)));
    }

    const idsFromRelays: Record<relay, eventUID[]> = {};
    for (const [id, relays] of this.pending) {
      for (const relay of relays) {
        idsFromRelays[relay] = idsFromRelays[relay] ?? [];
        idsFromRelays[relay].push(id);
      }
    }

    for (const [relay, ids] of Object.entries(idsFromRelays)) {
      const eventIds = ids.filter((id) => !id.includes(":"));
      const coordinates = ids.filter((id) => id.includes(":"));
      const filter: Filter[] = [];
      if (eventIds.length > 0) filter.push({ "#e": eventIds, kinds: [kinds.Zap] });
      if (coordinates.length > 0) filter.push({ "#a": coordinates, kinds: [kinds.Zap] });

      if (filter.length > 0) {
        const sub = relayPoolService
          .requestRelay(relay)
          .subscribe(filter, { onevent: (event) => this.handleEvent(event), oneose: () => sub.close() });
      }
    }
    this.pending.clear();
  }
}

const eventZapsService = new EventZapsService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.eventZapsService = eventZapsService;
}

export default eventZapsService;
