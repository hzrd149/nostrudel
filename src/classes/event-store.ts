import { getEventUID, isReplaceable } from "../helpers/nostr/events";
import replaceableEventLoaderService from "../services/replaceable-event-requester";
import { NostrEvent, isDTag } from "../types/nostr-event";
import Subject from "./subject";

export type EventFilter = (event: NostrEvent, store: EventStore) => boolean;

export default class EventStore {
  name?: string;
  events = new Map<string, NostrEvent>();

  constructor(name?: string) {
    this.name = name;
  }

  getSortedEvents() {
    return Array.from(this.events.values()).sort((a, b) => b.created_at - a.created_at);
  }

  onEvent = new Subject<NostrEvent>(undefined, false);
  onDelete = new Subject<string>(undefined, false);
  onClear = new Subject(undefined, false);

  private replaceableEventSubs = new Map<string, Subject<NostrEvent>>();
  private handleEvent(event: NostrEvent) {
    const id = getEventUID(event);
    const existing = this.events.get(id);
    if (!existing || event.created_at > existing.created_at) {
      this.events.set(id, event);
      this.onEvent.next(event);
    }
  }

  addEvent(event: NostrEvent) {
    const id = getEventUID(event);
    this.handleEvent(event);

    if (isReplaceable(event.kind)) {
      // pass the event on
      replaceableEventLoaderService.handleEvent(event);

      // subscribe to any future changes
      const sub = replaceableEventLoaderService.getEvent(event.kind, event.pubkey, event.tags.find(isDTag)?.[1]);
      sub.subscribe(this.handleEvent, this);
      this.replaceableEventSubs.set(id, sub);
    }
  }
  getEvent(id: string) {
    return this.events.get(id);
  }
  deleteEvent(id: string) {
    if (this.events.has(id)) {
      this.events.delete(id);
      this.onDelete.next(id);
    }

    if (this.replaceableEventSubs.has(id)) {
      this.replaceableEventSubs.get(id)?.unsubscribe(this.handleEvent, this);
      this.replaceableEventSubs.delete(id);
    }
  }

  clear() {
    this.events.clear();
    this.onClear.next(undefined);

    for (const [_, sub] of this.replaceableEventSubs) {
      sub.unsubscribe(this.handleEvent, this);
    }
  }
  cleanup() {
    this.clear();
  }

  connect(other: EventStore) {
    other.onEvent.subscribe(this.addEvent, this);
    other.onDelete.subscribe(this.deleteEvent, this);
  }
  disconnect(other: EventStore) {
    other.onEvent.unsubscribe(this.addEvent, this);
    other.onDelete.unsubscribe(this.deleteEvent, this);
  }

  getFirstEvent(nth = 0, filter?: EventFilter) {
    const events = this.getSortedEvents();

    let i = 0;
    while (true) {
      const event = events.shift();
      if (!event) return;
      if (filter && !filter(event, this)) continue;
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
      if (filter && !filter(event, this)) continue;
      if (i === nth) return event;
      i++;
    }
  }
}
