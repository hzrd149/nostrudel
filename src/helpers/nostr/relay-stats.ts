import { getTagValue } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

export const MONITOR_STATS_KIND = 30166;

export function getNetwork(stats: NostrEvent) {
  return getTagValue(stats, "n");
}
export function getSupportedNIPs(stats: NostrEvent) {
  return stats.tags.filter((t) => t[0] === "N" && t[1]).map((t) => t[1] && parseInt(t[1]));
}

export type MonitorCountry = { code?: string; name?: string };

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** Gets the country a monitor announces it is located in from its ISO-3166-1 and countryName labels */
export function getMonitorCountry(event: NostrEvent): MonitorCountry | undefined {
  const code = event.tags.find(
    (t) =>
      (t[2] === "ISO-3166-1" || t[2] === "countryCode") && (t[0] === "l" || t[0] === "G") && /^[A-Z]{2}$/.test(t[1]),
  )?.[1];
  let name = event.tags.find((t) => t[0] === "l" && t[2] === "countryName")?.[1];
  if (!name && code) name = regionNames.of(code);

  if (!code && !name) return undefined;
  return { code, name };
}

/** Converts a two letter country code into its flag emoji */
export function getCountryFlag(code: string) {
  return String.fromCodePoint(...Array.from(code.toUpperCase(), (c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** Formats a monitor's report frequency in seconds as a human readable interval */
export function formatMonitorFrequency(seconds: number) {
  const units: [number, string][] = [
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [size, unit] of units) {
    if (seconds < size) continue;
    const count = Math.round(seconds / size);
    return count === 1 ? `every ${unit}` : `every ${count} ${unit}s`;
  }
  return `every ${seconds} seconds`;
}

const FRIENDLY_CHECKS: Record<string, string> = { open: "connecting", read: "reading", write: "writing" };

/** Gets the user facing names of the relay capabilities a monitor tests */
export function getMonitorFriendlyChecks(checks: string[]) {
  return checks.map((check) => FRIENDLY_CHECKS[check]).filter(Boolean);
}

/** Gets the non-clearnet networks a monitor checks relays on */
export function getMonitorExtraNetworks(event: NostrEvent) {
  return event.tags
    .filter((t) => t[0] === "n" && t[1] && t[1] !== "clearnet")
    .map((t) => (t[1] === "tor" ? "Tor" : t[1].toUpperCase()));
}
