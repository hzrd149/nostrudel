import stringify from "json-stringify-deterministic";
import { NostrQuery, NostrRequestFilter, RelayQueryMap } from "../../types/nostr-query";
import localCacheRelayService, { LOCAL_CACHE_RELAY } from "../../services/local-cache-relay";

export function addQueryToFilter(filter: NostrRequestFilter, query: NostrQuery) {
  if (Array.isArray(filter)) {
    return filter.map((f) => ({ ...f, ...query }));
  }
  return { ...filter, ...query };
}

export function isFilterEqual(a: NostrRequestFilter, b: NostrRequestFilter) {
  return stringify(a) === stringify(b);
}

export function mapQueryMap(queryMap: RelayQueryMap, fn: (filter: NostrRequestFilter) => NostrRequestFilter) {
  const newMap: RelayQueryMap = {};
  for (const [relay, filter] of Object.entries(queryMap)) newMap[relay] = fn(filter);
  return newMap;
}

export function createSimpleQueryMap(relays: string[], filter: NostrRequestFilter) {
  const map: RelayQueryMap = {};

  // if the local cache relay is enabled, also ask it
  if (localCacheRelayService.enabled) {
    map[LOCAL_CACHE_RELAY] = filter;
  }

  for (const relay of relays) map[relay] = filter;

  return map;
}
