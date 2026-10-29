import { mapEventsToStore } from "applesauce-core";
import { onlyEvents } from "applesauce-relay";
import hash_sum from "hash-sum";
import { Filter, NostrEvent } from "nostr-tools";
import { finalize, ignoreElements, merge, Observable, share, timer } from "rxjs";

import ignoreRelayErrors from "../helpers/ignore-relay-errors";
import { cacheRequest } from "./event-cache";
import { eventStore } from "./event-store";
import pool from "./pool";

/** Open NIP-66 subscriptions, keyed by relays and filter (ignoring `since`) */
const subscriptions = new Map<string, Observable<never>>();

/**
 * Loads cached and live NIP-66 relay discovery events (kind 30166) into the event store. Subscriptions for the
 * same relays and filter are shared and close a minute after the last subscriber leaves
 */
export function relayDiscoverySubscription(relays: string[], filter: Filter): Observable<never> {
  const { since: _since, ...rest } = filter;
  const key = hash_sum([relays, rest]);

  let subscription = subscriptions.get(key);
  if (!subscription) {
    subscription = merge(
      cacheRequest([filter]),
      pool.subscription(relays, filter).pipe(ignoreRelayErrors("Relay discovery"), onlyEvents()),
    ).pipe(
      mapEventsToStore(eventStore),
      ignoreElements(),
      finalize(() => subscriptions.delete(key)),
      share({ resetOnRefCountZero: () => timer(60_000) }),
    );
    subscriptions.set(key, subscription);
  }

  return subscription;
}

/** Subscribes to NIP-66 relay discovery events and emits the events in the store that match the filter */
export function relayDiscoveryTimeline(relays: string[], filter: Filter): Observable<NostrEvent[]> {
  return merge(relayDiscoverySubscription(relays, filter), eventStore.timeline(filter));
}
