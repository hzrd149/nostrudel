import stringify from "json-stringify-deterministic";
import { NostrRequestFilter, RelayQueryMap } from "../../types/nostr-relay";
import { Filter } from "nostr-tools";
import { safeRelayUrls } from "../relay";

export function addQueryToFilter(filter: NostrRequestFilter, query: Filter) {
  if (Array.isArray(filter)) {
    return filter.map((f) => ({ ...f, ...query }));
  }
  return { ...filter, ...query };
}

export function stringifyFilter(filter: NostrRequestFilter) {
  return stringify(filter);
}
export function isFilterEqual(a: NostrRequestFilter, b: NostrRequestFilter) {
  return stringifyFilter(a) === stringifyFilter(b);
}

export function isQueryMapEqual(a: RelayQueryMap, b: RelayQueryMap) {
  return stringify(a) === stringify(b);
}

export function mapQueryMap(queryMap: RelayQueryMap, fn: (filter: NostrRequestFilter) => NostrRequestFilter) {
  const newMap: RelayQueryMap = {};
  for (const [relay, filter] of Object.entries(queryMap)) newMap[relay] = fn(filter);
  return newMap;
}

export function createSimpleQueryMap(relays: Iterable<string>, filter: NostrRequestFilter) {
  const map: RelayQueryMap = {};
  for (const relay of safeRelayUrls(relays)) map[relay] = filter;
  return map;
}
