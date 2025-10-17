import { includeFallbackRelays, includeMailboxes, Model } from "applesauce-core";
import {
  getProfilePointersFromList,
  groupPubkeysByRelay,
  OutboxMap,
  selectOptimalRelays,
} from "applesauce-core/helpers";
import { LoadableAddressPointer } from "applesauce-loaders/loaders";
import { ignoreUnhealthyRelaysOnPointers } from "applesauce-relay";
import { ProfilePointer } from "nostr-tools/nip19";
import { combineLatestWith, map, MonoTypeOperatorFunction, of, pipe, switchMap, throttleTime } from "rxjs";
import { eventStore } from "../services/event-store";
import { liveness } from "../services/pool";
import localSettings from "../services/preferences";

/** Gets the outboxes for a list of users */
export function OutboxSelectionModel(
  list: LoadableAddressPointer,
): Model<{ outboxes: OutboxMap; selection: ProfilePointer[] } | undefined> {
  return (events) =>
    events.replaceable(list).pipe(
      map((event) => (event ? getProfilePointersFromList(event) : undefined)),
      switchMap((users) => {
        // NOTE: dealing with undefined inside of RxJS observables feels like an anti-pattern, cant i just filter(v => !!v) instead and leave react to deal with the value not being ready?
        if (!users) return of(undefined);

        return of(users).pipe(
          outboxSelection(),
          // Select optimal relays
          map((selection) => {
            const outboxes = groupPubkeysByRelay(selection);
            return { outboxes, selection };
          }),
        );
      }),
    );
}

/** Include outboxes and remove unhealthy relays */
export function includeOutboxRelays(): MonoTypeOperatorFunction<ProfilePointer[]> {
  return pipe(
    // Add users outbox relays
    includeMailboxes(eventStore, "outbox"),
    // Get the extra relays
    includeFallbackRelays(localSettings.fallbackRelays),
    // Ignore unhealthy relays
    ignoreUnhealthyRelaysOnPointers(liveness),
  );
}

/** Default outbox relay selection for app  */
export function outboxSelection(): MonoTypeOperatorFunction<ProfilePointer[]> {
  return pipe(
    includeOutboxRelays(),
    // Get connection settings
    combineLatestWith(localSettings.maxConnections, localSettings.maxRelaysPerUser),
    // Only recalculate every 500ms
    throttleTime(500),
    // Select optimal relays
    map(([users, maxConnections, maxRelaysPerUser]) =>
      selectOptimalRelays(users, { maxConnections, maxRelaysPerUser }),
    ),
  );
}
