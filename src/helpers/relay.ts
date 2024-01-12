import { SimpleRelay, SimpleSubscription, SimpleSubscriptionOptions } from "nostr-idb";
import { RelayConfig } from "../classes/relay";
import { NostrQuery, NostrRequestFilter } from "../types/nostr-query";
import { safeRelayUrl } from "./url";
import { Filter } from "nostr-tools";
import { NostrEvent } from "../types/nostr-event";

export function normalizeRelayConfigs(relays: RelayConfig[]) {
  const seen: string[] = [];
  return relays.reduce((newArr, r) => {
    const safeUrl = safeRelayUrl(r.url);
    if (safeUrl && !seen.includes(safeUrl)) {
      seen.push(safeUrl);
      newArr.push({ ...r, url: safeUrl });
    }
    return newArr;
  }, [] as RelayConfig[]);
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

export function relayRequest(relay: SimpleRelay, filters: Filter[], opts: SimpleSubscriptionOptions = {}) {
  return new Promise<NostrEvent[]>((res) => {
    const events: NostrEvent[] = [];
    const sub: SimpleSubscription = relay.subscribe(filters, {
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
