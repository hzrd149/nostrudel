import { defined } from "applesauce-core";
import { createOutboxMap, getProfilePointersFromList, LRU, OutboxMap } from "applesauce-core/helpers";
import { LoadableAddressPointer } from "applesauce-loaders/loaders";
import hash_sum from "hash-sum";
import { map, Observable, shareReplay, tap } from "rxjs";

import { logger } from "../helpers/debug";
import { outboxSelection } from "../models/outbox-selection";
import { eventStore } from "./event-store";

const MAX_CACHE = 30;

class OutboxCacheService {
  protected outboxMaps = new LRU<Observable<OutboxMap>>(MAX_CACHE);
  protected log = logger.extend("OutboxCacheService");

  // Get or create an outbox map observable for a list
  getOutboxMap(list: LoadableAddressPointer): Observable<OutboxMap> {
    // Create a cache key for the list
    const key = hash_sum(["outbox-map", list.kind, list.pubkey, list.identifier]);

    // Return the existing observable if it exists
    let existing = this.outboxMaps.get(key);
    if (existing) return existing;

    this.log(`Creating outbox map for ${list.kind}:${list.pubkey}:${list.identifier}`);

    // Create an observable for the outbox map for the list
    const outboxMap$ = eventStore.replaceable(list).pipe(
      // Get users from the list
      map((event) => (event ? getProfilePointersFromList(event) : undefined)),
      // Filter out undefined
      defined(),
      // Select outboxes for users
      outboxSelection(),
      // Log outbox map changes
      tap(() => this.log(`Updating outbox map for ${list.kind}:${list.pubkey}:${list.identifier}`)),
      // Group outboxes by relay
      map((selection) => createOutboxMap(selection)),
      // Share the outbox map so it can be cached
      shareReplay(1),
    );

    this.outboxMaps.set(key, outboxMap$);
    return outboxMap$;
  }
}

const outboxCacheService = new OutboxCacheService();

if (import.meta.env.DEV) {
  //@ts-ignore
  window.outboxCacheService = outboxCacheService;
}

export default outboxCacheService;
