import type { Event } from './event.ts';
type EventParams<K extends number> = Partial<Event<K>>;
/** Build an event for testing purposes. */
export declare function buildEvent<K extends number = 1>(params: EventParams<K>): Event<K>;
export {};
