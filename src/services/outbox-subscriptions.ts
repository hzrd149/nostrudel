import { mapEventsToStore } from "applesauce-core";
import { LoadableAddressPointer } from "applesauce-loaders/loaders";
import { Filter } from "nostr-tools";
import { ignoreElements, Observable } from "rxjs";

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

    const { authors: _authors, ...filterWithoutAuthors } = filter;
    return pool.outboxSubscription(outboxCacheService.getOutboxMap(list), filterWithoutAuthors).pipe(
      mapEventsToStore(eventStore),
      // Consumers render from the store; the pool retains unchanged relay subscriptions.
      ignoreElements(),
    );
  }
}

const outboxSubscriptionsService = new OutboxSubscriptionsService();

export default outboxSubscriptionsService;
