import { TimelessFilter } from "applesauce-loaders";
import { createOutboxTimelineLoader, LoadableAddressPointer } from "applesauce-loaders/loaders";
import hash_sum from "hash-sum";
import { useMemo } from "react";

import { cacheRequest } from "../services/event-cache";
import { eventStore } from "../services/event-store";
import outboxCacheService from "../services/outbox-cache";
import pool from "../services/pool";

/** Gets or creates the outbox timeline loader for a list and filter */
export function useOutboxTimelineLoader(list?: LoadableAddressPointer, filter?: TimelessFilter) {
  return useMemo(() => {
    if (!list || !filter) return undefined;

    const outboxMap$ = outboxCacheService.getOutboxMap(list);

    return createOutboxTimelineLoader(pool, outboxMap$, filter, {
      eventStore,
      limit: 100,
      cache: cacheRequest,
    });
  }, [JSON.stringify(list), hash_sum(filter)]);
}
