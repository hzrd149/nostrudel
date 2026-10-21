import { MutedThings } from "applesauce-common/helpers";
import { Filter, NostrEvent } from "nostr-tools";
import { distinctUntilChanged, map, of, startWith, switchMap } from "rxjs";

import { observeNotifications } from "../../helpers/notification-query";
import { shareAndHold } from "../../helpers/observable";
import { MutesQuery } from "../../models";
import accounts from "../accounts";
import { eventStore } from "../event-store";

export function createNotificationQuery<T>(
  filters: (user: string) => Filter[],
  project: (events: NostrEvent[], user: string, mutes: MutedThings | undefined) => T,
  empty: T,
) {
  return accounts.active$.pipe(
    map((account) => account?.pubkey),
    distinctUntilChanged(),
    switchMap((user) =>
      user
        ? observeNotifications(eventStore, filters(user), eventStore.model(MutesQuery, user), (events, mutes) =>
            project(events, user, mutes),
          ).pipe(startWith(empty))
        : of(empty),
    ),
    shareAndHold(1000),
  );
}
