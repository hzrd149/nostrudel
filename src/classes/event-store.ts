import { getEventUID } from "../helpers/nostr/event";
import { NostrEvent } from "../types/nostr-event";
import Subject from "./subject";

type EventFilter = (event: NostrEvent) => boolean;
export default class EventStore {
  name?: string;
  events = new Map<string, NostrEvent>();

  constructor(name?: string) {
    this.name = name;
  }

  getSortedEvents() {
    return Array.from(this.events.values()).sort((a, b) => b.created_at - a.created_at);
  }

  onEvent = new Subject<NostrEvent>();
  onClear = new Subject();

  addEvent(event: NostrEvent) {
    const id = getEventUID(event);
    const existing = this.events.get(id);
    if (!existing || event.created_at > existing.created_at) {
      this.events.set(id, event);
      this.onEvent.next(event);
      return true;
    }
    return false;
  }

  clear() {
    this.events.clear();
    this.onClear.next(null);
  }

  connect(other: EventStore) {
    other.onEvent.subscribe(this.addEvent, this);
  }
  disconnect(other: EventStore) {
    other.onEvent.unsubscribe(this.addEvent, this);
  }

  getFirstEvent(nth = 0, filter?: EventFilter) {
    const events = this.getSortedEvents();
    const filteredEvents = filter ? events.filter(filter) : events;
    for (let i = 0; i <= nth; i++) {
      const event = filteredEvents[i];
      if (event) return event;
    }
  }
  getLastEvent(nth = 0, filter?: EventFilter) {
    const events = this.getSortedEvents();
    const filteredEvents = filter ? events.filter(filter) : events;
    for (let i = nth; i >= 0; i--) {
      const event = filteredEvents[filteredEvents.length - 1 - i];
      if (event) return event;
    }
  }
}
