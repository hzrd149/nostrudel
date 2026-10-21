import { GiftWrapsModel } from "applesauce-common/models";
import { BehaviorSubject, combineLatest, EMPTY, finalize, map, Subscription, switchMap } from "rxjs";

import { logger } from "../helpers/debug";
import { decryptGiftWraps } from "../helpers/nostr/gift-wrap-decryption";
import accounts from "./accounts";
import { eventStore } from "./event-store";

const log = logger.extend("GiftWrapDecryption");
const FAILED_KEY = "failed-gift-wraps";

/** Gift wraps the signer could not decrypt, remembered so they don't prompt again */
export const failedGiftWraps$ = new BehaviorSubject<string[]>(JSON.parse(localStorage.getItem(FAILED_KEY) ?? "[]"));
failedGiftWraps$.subscribe((ids) => localStorage.setItem(FAILED_KEY, JSON.stringify(ids)));

export function isGiftWrapFailed(id: string) {
  return failedGiftWraps$.value.includes(id);
}

export function markGiftWrapFailed(id: string) {
  if (!isGiftWrapFailed(id)) failedGiftWraps$.next([...failedGiftWraps$.value, id]);
}

/** Forgets the failed gift wraps so the next decryption run tries them again */
export function retryFailedGiftWraps() {
  failedGiftWraps$.next([]);
}

/** Returns a user's locked gift wraps that have not failed to decrypt */
export function lockedGiftWraps(pubkey: string) {
  return combineLatest([eventStore.model(GiftWrapsModel, pubkey, false), failedGiftWraps$]).pipe(
    map(([gifts, failed]) => gifts.filter((gift) => !failed.includes(gift.id))),
  );
}

/** Whether the decryption queue is running, it keeps decrypting new gift wraps until stopped */
export const giftWrapDecryptionRunning$ = new BehaviorSubject(false);
/** The number of gift wraps the current run has decrypted */
export const giftWrapsDecrypted$ = new BehaviorSubject(0);

let run: Subscription | undefined;

/** Starts decrypting the active account's locked gift wraps one at a time, a rejected signer prompt stops it */
export function startGiftWrapDecryption() {
  if (run) return;
  giftWrapDecryptionRunning$.next(true);
  run = accounts.active$
    .pipe(
      switchMap((account) =>
        account
          ? decryptGiftWraps({
              store: eventStore,
              pubkey: account.pubkey,
              signer: account,
              isFailed: isGiftWrapFailed,
              onFailed: markGiftWrapFailed,
            })
          : EMPTY,
      ),
      finalize(() => {
        run = undefined;
        giftWrapDecryptionRunning$.next(false);
      }),
    )
    .subscribe({
      next: (count) => giftWrapsDecrypted$.next(count),
      // The user rejected the signer prompt, so stop asking until they start the queue again
      error: (error) => log("Stopped decrypting: %s", error instanceof Error ? error.message : error),
    });
}

export function stopGiftWrapDecryption() {
  run?.unsubscribe();
}
