import { Filter, kinds, nip25 } from "nostr-tools";
import _throttle from "lodash.throttle";

import Subject from "../classes/subject";
import SuperMap from "../classes/super-map";
import { NostrEvent } from "../types/nostr-event";
import { localRelay } from "./local-relay";
import { relayRequest } from "../helpers/relay";
import relayPoolService from "./relay-pool";

type eventId = string;
type relay = string;

class EventReactionsService {
  subjects = new SuperMap<eventId, Subject<NostrEvent[]>>(() => new Subject<NostrEvent[]>([]));
  pending = new SuperMap<eventId, Set<relay>>(() => new Set());

  requestReactions(eventId: string, relays: Iterable<string>, alwaysRequest = true) {
    const subject = this.subjects.get(eventId);

    if (!subject.value || alwaysRequest) {
      for (const relay of relays) {
        this.pending.get(eventId).add(relay);
      }
    }
    this.throttleBatchRequest();

    return subject;
  }

  handleEvent(event: NostrEvent, cache = true) {
    if (event.kind !== kinds.Reaction) return;
    const pointer = nip25.getReactedEventPointer(event);
    if (!pointer?.id) return;

    const subject = this.subjects.get(pointer.id);
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
    if (ids.length > 0) filters.push({ "#e": ids, kinds: [kinds.Reaction] });
    if (cords.length > 0) filters.push({ "#a": cords, kinds: [kinds.Reaction] });
    if (filters.length > 0 && localRelay) {
      relayRequest(localRelay, filters).then((events) => events.forEach((e) => this.handleEvent(e, false)));
    }

    const idsFromRelays: Record<relay, eventId[]> = {};
    for (const [id, relays] of this.pending) {
      for (const relay of relays) {
        idsFromRelays[relay] = idsFromRelays[relay] ?? [];
        idsFromRelays[relay].push(id);
      }
    }

    for (const [relay, ids] of Object.entries(idsFromRelays)) {
      const eventIds = ids.filter((id) => !id.includes(":"));
      const coordinates = ids.filter((id) => id.includes(":"));
      const filters: Filter[] = [];
      if (eventIds.length > 0) filters.push({ "#e": eventIds, kinds: [kinds.Reaction] });
      if (coordinates.length > 0) filters.push({ "#a": coordinates, kinds: [kinds.Reaction] });

      if (filters.length > 0) {
        const subscription = relayPoolService
          .requestRelay(relay)
          .subscribe(filters, { onevent: (event) => this.handleEvent(event), oneose: () => subscription.close() });
      }
    }
    this.pending.clear();
  }
}

const eventReactionsService = new EventReactionsService();

if (import.meta.env.DEV) {
  //@ts-expect-error
  window.eventReactionsService = eventReactionsService;
}

export default eventReactionsService;
