import stringify from "json-stringify-deterministic";
import { NostrQuery, NostrRequestFilter, RelayQueryMap } from "../../types/nostr-query";

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
  for (const relay of relays) map[relay] = filter;
  return map;
}
