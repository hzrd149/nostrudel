import { EventStore } from "applesauce-core";
import { EventPointer } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import {
  catchError,
  defaultIfEmpty,
  defer,
  distinct,
  filter,
  map,
  mergeMap,
  Observable,
  of,
  ReplaySubject,
  Subscription,
  take,
  tap,
  timeout,
} from "rxjs";

import { getNotificationParentPointers } from "./nostr/notifications";

export type NotificationParentStatus = { pending: number; failed: number };

/** Resolve unknown parent authors without downloading the user's entire authored history. */
export function loadNotificationParents(
  events$: Observable<NostrEvent>,
  store: EventStore,
  load: (pointer: EventPointer) => Observable<NostrEvent>,
  onError: (error: unknown) => void,
  getPointers: (event: NostrEvent) => EventPointer[] = getNotificationParentPointers,
): Observable<NotificationParentStatus> {
  return new Observable<NotificationParentStatus>((observer) => {
    let pending = 0;
    let failed = 0;
    const statuses$ = new ReplaySubject<NotificationParentStatus>(1);
    const subscriptions = new Subscription();
    subscriptions.add(statuses$.subscribe(observer));
    const report = () => statuses$.next({ pending, failed });
    subscriptions.add(
      events$
        .pipe(
          mergeMap(getPointers),
          filter((pointer) => !pointer.author && !store.hasEvent(pointer.id)),
          distinct((pointer) => pointer.id),
          tap(() => {
            pending++;
            report();
          }),
          mergeMap(
            (pointer) =>
              defer(() => load(pointer)).pipe(
                filter((event) => event.id === pointer.id),
                take(1),
                timeout({ first: 15_000 }),
                catchError((error: unknown) => {
                  onError(error);
                  return of(undefined);
                }),
                defaultIfEmpty(undefined),
                map((event) => !!event),
              ),
            4,
          ),
        )
        .subscribe({
          next: (found) => {
            pending--;
            if (!found) failed++;
            report();
          },
          error: (error) => observer.error(error),
        }),
    );
    report();
    return () => {
      subscriptions.unsubscribe();
      statuses$.complete();
    };
  });
}
