import { mapEventsToStore } from "applesauce-core";
import { LoadableAddressPointer } from "applesauce-loaders/loaders";
import { Filter } from "nostr-tools";
import { ignoreElements, NEVER, Observable, switchMap } from "rxjs";
import { onlyEvents } from "applesauce-relay";

import { logger } from "../helpers/debug";
import { eventStore } from "./event-store";
import outboxCacheService from "./outbox-cache";
import pool from "./pool";

const log = logger.extend("OutboxSubscriptionsService");

class OutboxSubscriptionsService {
  /**
   * Create a live subscription to events from outboxes for a given list and filter
   * @param list The list to subscribe to outboxes for
   * @param filter The filter to apply to events (authors are added automatically from the outbox map)
   * @returns An observable that emits events from the outbox relays
   */
  subscription(list: LoadableAddressPointer, filter: Filter): Observable<never> {
    log(`Creating subscription for ${list.kind}:${list.pubkey}:${list.identifier}`, filter);

    return outboxCacheService.getOutboxMap(list).pipe(
      switchMap((outboxMap) => {
        // Check if we have any relays in the outbox map
        const relays = Object.keys(outboxMap);
        if (relays.length === 0) {
          log(`No relays found for ${list.kind}:${list.pubkey}:${list.identifier}`);
          return NEVER;
        }

        log(`Subscribing to ${relays.length} relays for ${list.kind}:${list.pubkey}:${list.identifier}`);

        // Use pool.outboxSubscription which automatically handles authors from the outbox map
        // The filter should not include authors as they're added automatically
        const { authors, ...filterWithoutAuthors } = filter;

        return pool.outboxSubscription(outboxMap, filterWithoutAuthors).pipe(
          onlyEvents(),
          mapEventsToStore(eventStore),
          // Ignore all updates since subscribers will get the events from the store
          ignoreElements(),
        );
      }),
    );
  }
}

const outboxSubscriptionsService = new OutboxSubscriptionsService();

export default outboxSubscriptionsService;
