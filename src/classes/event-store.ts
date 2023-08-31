import { getEventUID } from "../helpers/nostr/events";
import { NostrEvent } from "../types/nostr-event";
import Subject from "./subject";

export type EventFilter = (event: NostrEvent) => boolean;

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
    }
  }
  getEvent(id: string) {
    return this.events.get(id);
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

    let i = 0;
    while (true) {
      const event = events.shift();
      if (!event) return;
      if (filter && !filter(event)) continue;
      if (i === nth) return event;
      i++;
    }
  }
  getLastEvent(nth = 0, filter?: EventFilter) {
    const events = this.getSortedEvents();

    let i = 0;
    while (true) {
      const event = events.pop();
      if (!event) return;
      if (filter && !filter(event)) continue;
      if (i === nth) return event;
      i++;
    }
  }
}
