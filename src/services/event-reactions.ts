import { Kind, nip25 } from "nostr-tools";

import { NostrRequest } from "../classes/nostr-request";
import Subject from "../classes/subject";
import { SuperMap } from "../classes/super-map";
import { NostrEvent } from "../types/nostr-event";

type eventId = string;
type relay = string;

class EventReactionsService {
  subjects = new SuperMap<eventId, Subject<NostrEvent[]>>(() => new Subject<NostrEvent[]>([]));
  pending = new SuperMap<eventId, Set<relay>>(() => new Set());

  requestReactions(eventId: string, relays: relay[], alwaysFetch = true) {
    const subject = this.subjects.get(eventId);

    if (!subject.value || alwaysFetch) {
      for (const relay of relays) {
        this.pending.get(eventId).add(relay);
      }
    }

    return subject;
  }

  handleEvent(event: NostrEvent) {
    if (event.kind !== Kind.Reaction) return;
    const pointer = nip25.getReactedEventPointer(event);
    if (!pointer?.id) return;

    const subject = this.subjects.get(pointer.id);
    if (!subject.value) {
      subject.next([event]);
    } else if (!subject.value.some((e) => e.id === event.id)) {
      subject.next([...subject.value, event]);
    }
  }

  batchRequests() {
    if (this.pending.size === 0) return;

    const idsFromRelays: Record<relay, eventId[]> = {};
    for (const [id, relays] of this.pending) {
      for (const relay of relays) {
        idsFromRelays[relay] = idsFromRelays[relay] ?? [];
        idsFromRelays[relay].push(id);
      }
    }

    for (const [relay, ids] of Object.entries(idsFromRelays)) {
      const request = new NostrRequest([relay]);
      request.onEvent.subscribe(this.handleEvent, this);
      request.start({ "#e": ids, kinds: [Kind.Reaction] });
    }
    this.pending.clear();
  }
}

const eventReactionsService = new EventReactionsService();

setInterval(() => {
  eventReactionsService.batchRequests();
}, 1000 * 2);

export default eventReactionsService;
