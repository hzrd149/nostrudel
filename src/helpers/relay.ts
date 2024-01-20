import { SimpleRelay, SubscriptionOptions } from "nostr-idb";
import { Filter } from "nostr-tools";

import { NostrQuery, NostrRequestFilter } from "../types/nostr-query";
import { NostrEvent } from "../types/nostr-event";

// NOTE: only use this for equality checks and querying
export function getRelayVariations(relay: string) {
  if (relay.endsWith("/")) {
    return [relay.slice(0, -1), relay];
  } else return [relay, relay + "/"];
}

export function validateRelayURL(relay: string) {
  if (relay.includes(",ws")) throw new Error("Can not have multiple relays in one string");
  const url = new URL(relay);
  if (url.protocol !== "wss:" && url.protocol !== "ws:") throw new Error("Incorrect protocol");
  return url;
}
export function isValidRelayURL(relay: string) {
  try {
    validateRelayURL(relay);
    return true;
  } catch (e) {
    return false;
  }
}

export function normalizeRelayURL(relayUrl: string) {
  const url = validateRelayURL(relayUrl);
  url.pathname = url.pathname.replace(/\/+/g, "/");
  if ((url.port === "80" && url.protocol === "ws:") || (url.port === "443" && url.protocol === "wss:")) url.port = "";
  url.searchParams.sort();
  url.hash = "";
  return url.toString();
}
export function safeNormalizeRelayURL(relayUrl: string) {
  try {
    return normalizeRelayURL(relayUrl);
  } catch (e) {
    return null;
  }
}

// TODO: move these to helpers/relay
export function safeRelayUrl(relayUrl: string) {
  try {
    return validateRelayURL(relayUrl).toString();
  } catch (e) {
    return null;
  }
}
export function safeRelayUrls(urls: string[]): string[] {
  return urls.map(safeRelayUrl).filter(Boolean) as string[];
}

export function splitNostrFilterByPubkeys(
  filter: NostrRequestFilter,
  relayPubkeyMap: Record<string, string[]>,
): Record<string, NostrRequestFilter> {
  if (Array.isArray(filter)) {
    const dir: Record<string, NostrQuery[]> = {};

    for (const query of filter) {
      const split = splitQueryByPubkeys(query, relayPubkeyMap);
      for (const [relay, splitQuery] of Object.entries(split)) {
        dir[relay] = dir[relay] || [];
        dir[relay].push(splitQuery);
      }
    }

    return dir;
  } else return splitQueryByPubkeys(filter, relayPubkeyMap);
}

export function splitQueryByPubkeys(query: NostrQuery, relayPubkeyMap: Record<string, string[]>) {
  const filtersByRelay: Record<string, NostrQuery> = {};

  const allPubkeys = new Set(Object.values(relayPubkeyMap).flat());
  for (const [relay, pubkeys] of Object.entries(relayPubkeyMap)) {
    if (query.authors || query["#p"]) {
      filtersByRelay[relay] = {
        ...query,
        ...filtersByRelay[relay],
      };

      if (query.authors)
        filtersByRelay[relay].authors = query.authors.filter((p) => !allPubkeys.has(p)).concat(pubkeys);
      if (query["#p"]) filtersByRelay[relay]["#p"] = query["#p"].filter((p) => !allPubkeys.has(p)).concat(pubkeys);
    } else filtersByRelay[relay] = query;
  }

  return filtersByRelay;
}

export function relayRequest(relay: SimpleRelay, filters: Filter[], opts: SubscriptionOptions = {}) {
  return new Promise<NostrEvent[]>((res) => {
    const events: NostrEvent[] = [];
    const sub = relay.subscribe(filters, {
      ...opts,
      onevent: (e) => events.push(e),
      oneose: () => {
        sub.close();
        res(events);
      },
      onclose: () => res(events),
    });
  });
}
