import stringify from "json-stringify-deterministic";
import { Filter } from "nostr-tools";

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
