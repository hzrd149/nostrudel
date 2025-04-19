import { getReplaceableIdentifier, getTagValue } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

export const MONITOR_METADATA_KIND = 10166;
export const MONITOR_STATS_KIND = 30166;

export function getRelayURL(stats: NostrEvent) {
  return getReplaceableIdentifier(stats);
}
export function getNetwork(stats: NostrEvent) {
  return getTagValue(stats, "n");
}
export function getSupportedNIPs(stats: NostrEvent) {
  return stats.tags.filter((t) => t[0] === "N" && t[1]).map((t) => t[1] && parseInt(t[1]));
}

type RTTValues = {
  min: number;
  max?: number;
  average?: number;
  median?: number;
};
function getRTTTag(stats: NostrEvent, name: string): RTTValues | undefined {
  const values = stats.tags
    .find((t) => t[0] === "rtt" && t[1] === "open")
    ?.slice(2)
    .map((v) => parseInt(v));
  if (!values || values.length === 0) return undefined;

  return {
    min: values[0],
    max: values[1],
    average: values[2],
    median: values[3],
  };
}
export function getRTT(stats: NostrEvent) {
  const open = getRTTTag(stats, "open");
  const read = getRTTTag(stats, "read");
  const write = getRTTTag(stats, "write");

  return { open, read, write };
}
