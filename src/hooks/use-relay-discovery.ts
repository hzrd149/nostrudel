import {
  getRelayDiscoveryAttributes,
  getRelayDiscoveryURL,
  isValidRelayDiscovery,
  RELAY_DISCOVERY_KIND,
} from "applesauce-common/helpers";
import { mapEventsToStore } from "applesauce-core";
import { use$ } from "applesauce-react/hooks";
import { onlyEvents } from "applesauce-relay";
import { Filter, NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import { DEFAULT_RELAY_DISCOVERY_MONITORS, DEFAULT_RELAY_DISCOVERY_RELAYS } from "../const";
import { eventStore } from "../services/event-store";
import pool from "../services/pool";

export type RelayDiscoveryEntry = {
  /** The normalized relay URL */
  url: string;
  /** The NIP-66 attributes (W tags) of the relay */
  attributes: string[];
  /** The latest kind 30166 relay discovery event for the relay */
  event: NostrEvent;
};

/**
 * Subscribes to NIP-66 relay discovery events (kind 30166) that match any of the given attributes (OR)
 * and returns a deduplicated list of relays, or undefined while loading
 */
export default function useRelayDiscovery(
  attributes: string[],
  options?: { relays?: string[]; monitors?: string[] },
): RelayDiscoveryEntry[] | undefined {
  const discoveryRelays = options?.relays ?? DEFAULT_RELAY_DISCOVERY_RELAYS;
  const monitors = options?.monitors ?? DEFAULT_RELAY_DISCOVERY_MONITORS;

  const attributesKey = attributes.join(",");
  const filter = useMemo(() => {
    const filter: Filter = {
      kinds: [RELAY_DISCOVERY_KIND],
      authors: monitors,
      // set from https://github.com/nostr-protocol/nips/pull/230#pullrequestreview-2290873405
      since: Math.round(Date.now() / 1000) - 60 * 60 * 2,
    };
    if (attributes.length > 0) filter["#W"] = attributes;
    return filter;
  }, [attributesKey, monitors.join(",")]);

  // Subscribe to the discovery relays and save events to the store
  use$(
    () => pool.subscription(discoveryRelays, filter).pipe(onlyEvents(), mapEventsToStore(eventStore)),
    [filter, discoveryRelays.join(",")],
  );

  // Read matching events back from the event store
  const events = use$(() => eventStore.timeline(filter), [filter]);

  return useMemo(() => {
    if (!events) return undefined;

    // Dedupe by relay URL, keeping the newest event (multiple monitors can report the same relay)
    const byUrl = new Map<string, NostrEvent>();
    for (const event of events) {
      if (!isValidRelayDiscovery(event)) continue;

      const url = getRelayDiscoveryURL(event);
      if (!url) continue;

      const existing = byUrl.get(url);
      if (!existing || existing.created_at < event.created_at) byUrl.set(url, event);
    }

    return Array.from(byUrl.entries())
      .map(([url, event]) => ({ url, event, attributes: getRelayDiscoveryAttributes(event) }))
      .sort((a, b) => a.url.localeCompare(b.url));
  }, [events]);
}
