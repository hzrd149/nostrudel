import dayjs from "dayjs";

import SuperMap from "../classes/super-map";
import { NostrEvent } from "../types/nostr-event";
import { getReferences, sortByDate } from "./nostr/events";

export function groupByDay(events: NostrEvent[]) {
  const grouped = new SuperMap<number, NostrEvent[]>(() => []);
  for (const event of events) {
    const day = dayjs.unix(event.created_at).startOf("day").unix();
    grouped.get(day).push(event);
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
