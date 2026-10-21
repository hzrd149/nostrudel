import { createEventLoader, createSyncLoader } from "applesauce-loaders/loaders";
import { relaySet } from "applesauce-core/helpers";
import { Filter, kinds } from "nostr-tools";
import {
  combineLatest,
  defer,
  distinctUntilChanged,
  finalize,
  map,
  Observable,
  of,
  ReplaySubject,
  share,
  startWith,
  Subject,
  switchMap,
  take,
  timer,
} from "rxjs";

import { logger } from "../../helpers/debug";
import { createNotificationSync, NotificationSyncState } from "../../helpers/notification-sync";
import { loadNotificationParents, NotificationParentStatus } from "../../helpers/notification-parents";
import { getQuotePointers, SOCIAL_NOTIFICATION_KINDS } from "../../helpers/nostr/notifications";
import accounts from "../accounts";
import { cacheRequest, eventCache$ } from "../event-cache";
import { eventStore } from "../event-store";
import pool from "../pool";
import localSettings from "../preferences";

const log = logger.extend("NotificationSync");
const syncLoader = createSyncLoader({ pool, eventStore });
const onError = (error: unknown) => log("Acquisition failed: %s", error instanceof Error ? error.message : error);
export type NotificationDomain = "social" | "replies" | "quotes" | "conversations" | "reposts" | "zaps";
type ParentState = NotificationParentStatus & { retry: () => void };

function mailboxRelays(pubkey: string, role: "inboxes" | "outboxes") {
  return combineLatest([eventStore.mailboxes(pubkey).pipe(startWith(undefined)), localSettings.fallbackRelays]).pipe(
    map(([mailboxes, fallback]) => (mailboxes?.[role]?.length ? mailboxes[role] : fallback)),
  );
}

function syncFilter(filter: Filter, relays$: Observable<string[]>) {
  return defer(() => {
    const until = Math.floor(Date.now() / 1000);
    return createNotificationSync({
      filter,
      relays$,
      window: { since: Math.max(0, until - 2 * 86400), until },
      eventStore,
      syncLoader,
      cacheRequest,
      subscribeLive: (relays, filter) => pool.subscription(relays, filter),
      onError,
    });
  }).pipe(share({ connector: () => new ReplaySubject<NotificationSyncState>(1) }));
}

function combineStates(states: NotificationSyncState[], parents: ParentState): NotificationSyncState {
  const since = Math.min(...states.map((state) => state.since));
  const until = Math.max(...states.map((state) => state.until));
  const ensureSince = (since: number) => states.forEach((state) => state.ensureSince(since));
  return {
    since,
    until,
    windows: states.flatMap((state) => state.windows),
    done: states.every((state) => state.done) && parents.pending === 0,
    failedRelays: [...new Set(states.flatMap((state) => state.failedRelays))],
    liveError: states.find((state) => state.liveError)?.liveError,
    pendingParents: parents.pending,
    failedParents: parents.failed,
    ensureSince,
    loadMore: () => {
      if (states.every((state) => state.done)) ensureSince(Math.max(0, since - (until - since)));
    },
    retry: () => {
      states.forEach((state) => state.retry());
      parents.retry();
    },
  };
}

function parentSync(user: string, inbound$: Observable<NotificationSyncState>, quotesOnly = false) {
  return defer(() => {
    const controller = new AbortController();
    const loader = createEventLoader(pool, {
      cacheRequest,
      eventStore,
      bufferTime: 50,
      extraRelays: localSettings.fallbackRelays,
      signal: controller.signal,
    });
    const retry$ = new Subject<void>();
    const events$ = inbound$.pipe(
      map((state) => state.since),
      distinctUntilChanged(),
      switchMap((since) => eventStore.filters({ kinds: SOCIAL_NOTIFICATION_KINDS, "#p": [user], since })),
    );
    return retry$.pipe(
      startWith(undefined),
      switchMap(() =>
        loadNotificationParents(
          events$,
          eventStore,
          (pointer) =>
            mailboxRelays(user, "outboxes").pipe(
              take(1),
              switchMap((outboxes) =>
                loader({
                  ...pointer,
                  relays: relaySet(pointer.relays, outboxes),
                }),
              ),
            ),
          onError,
          quotesOnly ? getQuotePointers : undefined,
        ),
      ),
      map((state): ParentState => ({ ...state, retry: () => retry$.next() })),
      finalize(() => controller.abort()),
    );
  }).pipe(share({ connector: () => new ReplaySubject<ParentState>(1) }));
}

/** Lazily shared sources for one account/cache generation; each view activates only its dependencies. */
function accountSources(user: string): Record<NotificationDomain, Observable<NotificationSyncState>> {
  const inbound$ = syncFilter({ kinds: SOCIAL_NOTIFICATION_KINDS, "#p": [user] }, mailboxRelays(user, "inboxes"));
  const authored$ = syncFilter({ kinds: SOCIAL_NOTIFICATION_KINDS, authors: [user] }, mailboxRelays(user, "outboxes"));
  const parents$ = parentSync(user, inbound$);
  const quotes$ = parentSync(user, inbound$, true);
  return {
    social: inbound$,
    replies: combineLatest([inbound$, parents$]).pipe(map(([inbound, parents]) => combineStates([inbound], parents))),
    quotes: combineLatest([inbound$, quotes$]).pipe(map(([inbound, parents]) => combineStates([inbound], parents))),
    conversations: combineLatest([inbound$, authored$, parents$]).pipe(
      map(([inbound, authored, parents]) => combineStates([inbound, authored], parents)),
    ),
    reposts: syncFilter({ kinds: [kinds.Repost, kinds.GenericRepost], "#p": [user] }, mailboxRelays(user, "inboxes")),
    zaps: syncFilter({ kinds: [kinds.Zap], "#p": [user] }, mailboxRelays(user, "inboxes")),
  };
}

const sources$ = combineLatest([
  accounts.active$.pipe(
    map((account) => account?.pubkey),
    distinctUntilChanged(),
  ),
  eventCache$,
]).pipe(
  map(([user]) => (user ? accountSources(user) : undefined)),
  share({
    connector: () => new ReplaySubject<ReturnType<typeof accountSources> | undefined>(1),
    resetOnRefCountZero: () => timer(1000),
  }),
);

function domainSync(domain: NotificationDomain) {
  return sources$.pipe(
    switchMap((sources) => sources?.[domain] ?? of(undefined)),
    share({
      connector: () => new ReplaySubject<NotificationSyncState | undefined>(1),
      resetOnRefCountZero: () => timer(1000),
    }),
  );
}

export const socialSync$ = domainSync("social");
export const replySync$ = domainSync("replies");
export const quoteSync$ = domainSync("quotes");
export const conversationSync$ = domainSync("conversations");
export const repostSync$ = domainSync("reposts");
export const zapSync$ = domainSync("zaps");
export const notificationSync = {
  social: socialSync$,
  replies: replySync$,
  quotes: quoteSync$,
  conversations: conversationSync$,
  reposts: repostSync$,
  zaps: zapSync$,
};

if (import.meta.env.DEV && typeof window !== "undefined") Reflect.set(window, "notificationSync", notificationSync);
