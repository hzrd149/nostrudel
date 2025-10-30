import { TimelessFilter } from "applesauce-loaders";
import { LoadableAddressPointer } from "applesauce-loaders/loaders";
import hash_sum from "hash-sum";
import { useMemo } from "react";

import timelineCacheService from "../services/timeline-cache";

/** Gets or creates the outbox timeline loader for a list and filter */
export function useOutboxTimelineLoader(list?: LoadableAddressPointer, filter?: TimelessFilter) {
  return useMemo(() => {
    if (!list || !filter) return undefined;

    return timelineCacheService.createOutboxTimeline(list, filter);
  }, [JSON.stringify(list), hash_sum(filter)]);
}
