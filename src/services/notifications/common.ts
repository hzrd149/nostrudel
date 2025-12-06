import { getEventUID } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";
import { combineLatest, map, Observable, of, scan, shareReplay, switchMap } from "rxjs";

import { COMMENT_KIND } from "applesauce-core/helpers";
import { TimelineLoader } from "applesauce-loaders/loaders";
import accounts from "../accounts";
import { eventStore } from "../event-store";
import localSettings from "../preferences";
import timelineCacheService from "../timeline-cache";

// Get users mailboxes
const mailboxes$ = accounts.active$.pipe(
  switchMap((account) => (account ? eventStore.mailboxes(account.pubkey) : of(null))),
);

// Get users inboxes or fallback relays
export const inboxes$ = combineLatest([mailboxes$, localSettings.fallbackRelays]).pipe(
  map(([mailboxes, fallbackRelays]) => mailboxes?.inboxes ?? fallbackRelays),
);

/** Timeline loader for share notifications from the user's inboxes */
export const shareNotificationsLoader$: Observable<TimelineLoader | null> = combineLatest([
  accounts.active$,
  inboxes$,
]).pipe(
  map(([account, inboxes]) => {
    if (!account || inboxes.length === 0) return null;

    return timelineCacheService.createTimeline(`shares-notifications-${account.pubkey}`, inboxes, [
      {
        "#p": [account.pubkey],
        kinds: [kinds.Repost, kinds.GenericRepost],
      },
    ]);
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

    return timelineCacheService.createTimeline(`notifications-${account.pubkey}`, inboxes, [
      {
        "#p": [account.pubkey],
        kinds: [kinds.ShortTextNote, kinds.LongFormArticle, COMMENT_KIND],
      },
      // Also load the users own timeline from their inboxes so that replies to their own notes are shown
      { authors: [account.pubkey], kinds: [kinds.ShortTextNote, kinds.LongFormArticle, COMMENT_KIND] },
    ]);
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

    return timelineCacheService.createTimeline(`zaps-notifications-${account.pubkey}`, inboxes, [
      {
        "#p": [account.pubkey],
        kinds: [kinds.Zap],
      },
    ]);
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
