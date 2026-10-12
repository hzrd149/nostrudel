import { getTagValue } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

export const MONITOR_STATS_KIND = 30166;

export function getNetwork(stats: NostrEvent) {
  return getTagValue(stats, "n");
}
export function getSupportedNIPs(stats: NostrEvent) {
  return stats.tags.filter((t) => t[0] === "N" && t[1]).map((t) => t[1] && parseInt(t[1]));
}
