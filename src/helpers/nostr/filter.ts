import { Filter } from "nostr-tools";

export function mergeFilter(filter: Filter, query: Filter): Filter;
export function mergeFilter(filter: Filter[], query: Filter): Filter[];
export function mergeFilter(filter: Filter | Filter[], query: Filter) {
  if (Array.isArray(filter)) {
    return filter.map((f) => ({ ...f, ...query }));
  }
  return { ...filter, ...query };
}
