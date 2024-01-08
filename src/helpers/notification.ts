import SuperMap from "../classes/super-map";
import { NostrEvent } from "../types/nostr-event";
import { getReferences, sortByDate } from "./nostr/events";

const DAY_IN_SECONDS = 60 * 60 * 24;

export function groupByTime(events: NostrEvent[], time = DAY_IN_SECONDS) {
  const grouped = new SuperMap<number, NostrEvent[]>(() => []);
  for (const event of events) {
    const slot = Math.floor(event.created_at / time) * time;
    grouped.get(slot).push(event);
  }

  return Array.from(grouped.entries()).sort((a, b) => b[0] - a[0]);
}

export function groupByRoot(events: NostrEvent[]) {
  const grouped = new SuperMap<string, NostrEvent[]>(() => []);
  for (const event of events) {
    const refs = getReferences(event);
    if (refs.root?.e?.id) grouped.get(refs.root.e.id).push(event);
  }
  for (const [_, groupedEvents] of grouped) {
    groupedEvents.sort(sortByDate);
  }

  return Array.from(grouped.entries()).sort((a, b) => b[1][0].created_at - a[1][0].created_at);
}
