import { defined, mapEventsToStore } from "applesauce-core/observable";
import { createSyncLoader, SyncLoaderStatus } from "applesauce-loaders/loaders";
import { kinds } from "nostr-tools";
import { concat, defer, ignoreElements, NEVER, Observable, ReplaySubject, share, switchMap, take } from "rxjs";

import { DirectMessageRelaysModel } from "../models/messages";
import accounts from "./accounts";
import { cacheRequest } from "./event-cache";
import { eventStore } from "./event-store";
import pool from "./pool";

const DAY = 24 * 60 * 60;
/** NIP-59 randomizes gift wrap timestamps up to two days into the past */
export const GIFT_WRAP_JITTER = 2 * DAY;
/** Startup only reconciles recent gift wraps, older history is synced on demand from the inbox */
const STARTUP_SPAN = 30 * DAY;

const syncLoader = createSyncLoader({ pool, eventStore });

/** Reconciles a user's gift wraps since a date with their current DM relays, using NIP-77 where supported */
export function syncGiftWraps(pubkey: string, since: number): Observable<SyncLoaderStatus> {
  return syncLoader({
    // Take the current DM relay list so the sync completes instead of following list updates
    relays: eventStore.model(DirectMessageRelaysModel, pubkey).pipe(defined(), take(1)),
    // Reach further back because gift wrap timestamps are randomized into the past
    filter: { kinds: [kinds.GiftWrap], "#p": [pubkey], since: Math.max(0, since - GIFT_WRAP_JITTER) },
    waitForAuth: pubkey,
  }).status$;
}

/** Loads the active account's cached gift wraps, then syncs the last month once per account each session */
export const giftWrapStartupSync$ = accounts.active$.pipe(
  switchMap((account) => {
    if (!account) return NEVER;
    const filter = { kinds: [kinds.GiftWrap], "#p": [account.pubkey] };

    // Hydrate the store first so negentropy only downloads gift wraps missing from the cache
    const hydrate = defer(() => cacheRequest([filter])).pipe(mapEventsToStore(eventStore), ignoreElements());
    const now = Math.floor(Date.now() / 1000);
    return concat(hydrate, syncGiftWraps(account.pubkey, now - STARTUP_SPAN));
  }),
  share({ connector: () => new ReplaySubject<SyncLoaderStatus>(1), resetOnRefCountZero: false }),
);
