import { NostrEvent, isDTag } from "../../types/nostr-event";

export const SELF_REPORTED_KIND = 10066;
export const MONITOR_METADATA_KIND = 10166;
export const MONITOR_STATS_KIND = 30066;

export function getRelayURL(stats: NostrEvent) {
  if (stats.kind === SELF_REPORTED_KIND) return stats.tags.find((t) => t[0] === "r")?.[1];
  return stats.tags.find(isDTag)?.[1];
}
export function getNetwork(stats: NostrEvent) {
  return stats.tags.find((t) => t[0] === "n")?.[1];
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
