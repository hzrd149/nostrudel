import { isGiftWrapUnlocked, unlockGiftWrap } from "applesauce-common/helpers";
import { EncryptedContentSigner } from "applesauce-core/helpers/encrypted-content";
import { kinds, NostrEvent } from "nostr-tools";
import { catchError, concatMap, defer, filter, Observable, of, scan, startWith, throwError } from "rxjs";

/** Checks if a decryption error came from the user rejecting the signer prompt, so the gift wrap can be retried */
export function isSignerRejection(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("user");
}

type GiftWrapStore = { filters(filters: { kinds: number[]; "#p": string[] }): Observable<NostrEvent> };

type DecryptGiftWrapsOptions = {
  store: GiftWrapStore;
  pubkey: string;
  signer: EncryptedContentSigner;
  /** Checks if a gift wrap previously failed to decrypt */
  isFailed: (id: string) => boolean;
  /** Records a gift wrap that could not be decrypted so it does not prompt the signer again */
  onFailed: (id: string) => void;
};

/**
 * Decrypts every locked gift wrap one at a time, including ones that arrive later, and emits the number decrypted.
 * Gift wraps that fail are reported and skipped, a rejected signer prompt errors so the queue stops asking
 */
export function decryptGiftWraps({ store, pubkey, signer, isFailed, onFailed }: DecryptGiftWrapsOptions) {
  return store.filters({ kinds: [kinds.GiftWrap], "#p": [pubkey] }).pipe(
    filter((gift) => !isGiftWrapUnlocked(gift) && !isFailed(gift.id)),
    concatMap((gift) =>
      // The gift wrap may have been restored from the decryption cache while it was queued
      defer(async () => {
        if (!isGiftWrapUnlocked(gift)) await unlockGiftWrap(gift, signer);
        return true;
      }).pipe(
        catchError((error) => {
          if (isSignerRejection(error)) return throwError(() => error);
          onFailed(gift.id);
          return of(false);
        }),
      ),
    ),
    scan((count, ok) => (ok ? count + 1 : count), 0),
    startWith(0),
  );
}
