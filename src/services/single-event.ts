import createDefer, { Deferred } from "../classes/deferred";
import { NostrRequest } from "../classes/nostr-request";
import { NostrEvent } from "../types/nostr-event";

class SingleEventService {
  eventCache = new Map<string, NostrEvent>();
  pending = new Map<string, string[]>();
  pendingPromises = new Map<string, Deferred<NostrEvent>>();

  async requestEvent(id: string, relays: string[]) {
    const event = this.eventCache.get(id);
    if (event) return event;

    this.pending.set(id, this.pending.get(id)?.concat(relays) ?? relays);
    const deferred = createDefer<NostrEvent>();
    this.pendingPromises.set(id, deferred);
    return deferred;
  }

  handleEvent(event: NostrEvent) {
    this.eventCache.set(event.id, event);
    if (this.pendingPromises.has(event.id)) {
      this.pendingPromises.get(event.id)?.resolve(event);
      this.pendingPromises.delete(event.id);
    }
  }

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

setInterval(() => {
  singleEventService.batchRequests();
}, 1000);

export default singleEventService;
