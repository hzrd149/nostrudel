import { EventStore } from "applesauce-core";
import { MutedThings } from "applesauce-common/helpers";
import { Filter, NostrEvent } from "nostr-tools";
import { auditTime, combineLatest, map, Observable, startWith } from "rxjs";

/** Batch lossless store snapshots before classification, grouping and sorting. */
export function observeNotifications<T>(
  store: EventStore,
  filters: Filter[],
  mutes$: Observable<MutedThings | undefined>,
  project: (events: NostrEvent[], mutes: MutedThings | undefined) => T,
): Observable<T> {
  return combineLatest([store.timeline(filters), mutes$.pipe(startWith(undefined))]).pipe(
    auditTime(100),
    map(([events, mutes]) => project(events, mutes)),
  );
}
