import SuperMap from "../classes/super-map";
import { NostrEvent } from "nostr-tools";

const DAY_IN_SECONDS = 60 * 60 * 24;

export function groupByTime(events: NostrEvent[], time = DAY_IN_SECONDS) {
  const grouped = new SuperMap<number, NostrEvent[]>(() => []);
  for (const event of events) {
    const slot = Math.floor(event.created_at / time) * time;
    grouped.get(slot).push(event);
  }

  return Array.from(grouped.entries()).sort((a, b) => b[0] - a[0]);
}
