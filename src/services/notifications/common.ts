import { getEventUID } from "applesauce-core/helpers";
import { COMMENT_KIND, matchMutes, type MutedThings } from "applesauce-common/helpers";
import { createTimelineLoader, TimelineLoader } from "applesauce-loaders/loaders";
import { kinds, type NostrEvent } from "nostr-tools";
import { combineLatest, map, Observable, of, OperatorFunction, scan, shareReplay, switchMap } from "rxjs";

import { MutesQuery } from "../../models";
import accounts from "../accounts";
import { cacheRequest } from "../event-cache";
import { eventStore } from "../event-store";
import localSettings from "../preferences";
import pool from "../pool";

// Get users mailboxes
const mailboxes$ = accounts.active$.pipe(
  switchMap((account) => (account ? eventStore.mailboxes(account.pubkey) : of(null))),
);

// Get users inboxes or fallback relays
export const inboxes$ = combineLatest([mailboxes$, localSettings.fallbackRelays]).pipe(
  map(([mailboxes, fallbackRelays]) => mailboxes?.inboxes ?? fallbackRelays),
);

export function isMutedNotification(event: NostrEvent, user: string, mutes: MutedThings | undefined): boolean {
  if (event.pubkey === user) return false;

  return mutes ? matchMutes(mutes, event) : false;
}

export function filterNotificationEvents<T extends NostrEvent>(
  events: T[],
  user: string,
  mutes: MutedThings | undefined,
): T[] {
  return events.filter((event) => !isMutedNotification(event, user, mutes));
}

export function filterNotificationsByMutes<T extends NostrEvent>(user: string): OperatorFunction<T[], T[]> {
  return (source) =>
    combineLatest([source, eventStore.model(MutesQuery, user)]).pipe(
      map(([events, mutes]) => filterNotificationEvents(events, user, mutes)),
    );
}

/** Timeline loader for share notifications from the user's inboxes */
export const shareNotificationsLoader$: Observable<TimelineLoader | null> = combineLatest([
  accounts.active$,
  inboxes$,
]).pipe(
  map(([account, inboxes]) => {
    if (!account || inboxes.length === 0) return null;

    return createTimelineLoader(
      pool,
      inboxes,
      [
        {
          "#p": [account.pubkey],
          kinds: [kinds.Repost, kinds.GenericRepost],
        },
      ],
      {
        limit: 100,
        cache: cacheRequest,
        eventStore,
      },
    );
  }),
  // Only create a single timeline
  shareReplay(1),
);

/** Timeline loader for social notifications from the user's inboxes */
export const socialNotificationsLoader$: Observable<TimelineLoader | null> = combineLatest([
  accounts.active$,
  inboxes$,
]).pipe(
  map(([account, inboxes]) => {
    if (!account || inboxes.length === 0) return null;

    return createTimelineLoader(
      pool,
      inboxes,
      [
        {
          "#p": [account.pubkey],
          kinds: [kinds.ShortTextNote, kinds.LongFormArticle, COMMENT_KIND],
        },
        // Also load the users own timeline from their inboxes so that replies to their own notes are shown
        { authors: [account.pubkey], kinds: [kinds.ShortTextNote, kinds.LongFormArticle, COMMENT_KIND] },
      ],
      {
        limit: 100,
        cache: cacheRequest,
        eventStore,
      },
    );
  }),
  // Only create a single timeline
  shareReplay(1),
);

/** Timeline loader for zap notifications from the user's inboxes */
export const zapNotificationsLoader$: Observable<TimelineLoader | null> = combineLatest([
  accounts.active$,
  inboxes$,
]).pipe(
  map(([account, inboxes]) => {
    if (!account || inboxes.length === 0) return null;

    return createTimelineLoader(
      pool,
      inboxes,
      [
        {
          "#p": [account.pubkey],
          kinds: [kinds.Zap],
        },
      ],
      {
        limit: 100,
        cache: cacheRequest,
        eventStore,
      },
    );
  }),
  // Only create a single timeline
  shareReplay(1),
);

/** An observable of all event ids the user has authored */
export const userEvents$ = accounts.active$.pipe(
  switchMap((account) => {
    if (!account) return of(new Set<string>());

    return eventStore
      .filters({
        authors: [account.pubkey],
      })
      .pipe(
        scan((ids, event) => {
          ids.add(getEventUID(event));
          return ids;
        }, new Set<string>()),
      );
  }),
  shareReplay(1),
);
