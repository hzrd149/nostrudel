import stringify from "json-stringify-deterministic";
import { RelayQueryMap } from "../../types/nostr-relay";
import { Filter } from "nostr-tools";
import { safeRelayUrls } from "../relay";

export function mergeFilter(filter: Filter, query: Filter): Filter;
export function mergeFilter(filter: Filter[], query: Filter): Filter[];
export function mergeFilter(filter: Filter | Filter[], query: Filter) {
  if (Array.isArray(filter)) {
    return filter.map((f) => ({ ...f, ...query }));
  }
  return { ...filter, ...query };
}

export function stringifyFilter(filter: Filter | Filter[]) {
  return stringify(filter);
}
export function isFilterEqual(a: Filter | Filter[], b: Filter | Filter[]) {
  return stringifyFilter(a) === stringifyFilter(b);
}

export function isQueryMapEqual(a: RelayQueryMap, b: RelayQueryMap) {
  return stringify(a) === stringify(b);
}

export function mapQueryMap(queryMap: RelayQueryMap, fn: (filters: Filter[]) => Filter[]) {
  const newMap: RelayQueryMap = {};
  for (const [relay, filters] of Object.entries(queryMap)) newMap[relay] = fn(filters);
  return newMap;
}

export function createSimpleQueryMap(relays: Iterable<string>, filters: Filter | Filter[]) {
  const map: RelayQueryMap = {};
  for (const relay of safeRelayUrls(relays)) map[relay] = Array.isArray(filters) ? filters : [filters];
  return map;
}
