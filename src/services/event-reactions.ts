import { Filter, kinds, nip25 } from "nostr-tools";

import NostrRequest from "../classes/nostr-request";
import Subject from "../classes/subject";
import SuperMap from "../classes/super-map";
import { NostrEvent } from "../types/nostr-event";
import { localRelay } from "./local-relay";
import { relayRequest } from "../helpers/relay";

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

    if (cache) localRelay.publish(event);
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
      const filter: Filter = { "#e": ids, kinds: [kinds.Reaction] };

      // load from local relay
      relayRequest(localRelay, [filter]).then((events) => events.forEach((e) => this.handleEvent(e)));

      const request = new NostrRequest([relay]);
      request.onEvent.subscribe(this.handleEvent, this);
      request.start(filter);
    }
    this.pending.clear();
  }
}

const eventReactionsService = new EventReactionsService();

setInterval(() => {
  eventReactionsService.batchRequests();
}, 1000 * 2);

export default eventReactionsService;
