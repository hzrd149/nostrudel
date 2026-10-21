import { isPTag } from "applesauce-core/helpers";
import {
  getLegacyMessageCorrespondent,
  persistEncryptedContent,
  unlockGiftWrap,
  unlockLegacyMessage,
} from "applesauce-common/helpers";
import { defined } from "applesauce-core/observable";
import localforage from "localforage";
import { NostrEvent } from "nostr-social-graph";
import { kinds } from "nostr-tools";
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  of,
  pairwise,
  shareReplay,
  switchMap,
  take,
} from "rxjs";

import EncryptedStorage from "../classes/encrypted-storage";
import { logger } from "../helpers/debug";
import { isSignerRejection } from "../helpers/nostr/gift-wrap-decryption";
import accounts from "./accounts";
import { eventStore } from "./event-store";
import { isGiftWrapFailed, markGiftWrapFailed } from "./gift-wrap-decryption";
import localSettings from "./preferences";

const log = logger.extend("DecryptionCache");

export const decryptionCache$ = localSettings.enableDecryptionCache.pipe(
  switchMap((enable) => {
    if (!enable) return of(null);

    // If enabled create a database instance
    return combineLatest([localSettings.encryptDecryptionCache, localSettings.encryptionSalt]).pipe(
      map(([encrypt, salt]) => {
        const kv = localforage.createInstance({ name: "decryption-cache" });

        if (encrypt) return new EncryptedStorage(kv, salt);
        else return kv;
      }),
      switchMap((cache) => {
        // Re-emit the encrypted cache when it is unlocked
        if (cache instanceof EncryptedStorage)
          return cache.unlocked$.pipe(
            distinctUntilChanged(),
            map(() => cache),
          );
        return of(cache);
      }),
    );
  }),
  shareReplay(1),
);

// Keep decryption cache active
decryptionCache$.subscribe();

// Clear cache when encryption setting changes
localSettings.encryptDecryptionCache
  .pipe(
    pairwise(),
    filter(([prev, curr]) => prev !== curr),
    // take(1) so later lock-state re-emissions of the same cache don't clear it again
    switchMap(() => decryptionCache$.pipe(defined(), take(1))),
  )
  .subscribe((cache) => cache.clear());

// Clear cache when its disabled
decryptionCache$.pipe(pairwise()).subscribe(([prev, curr]) => {
  if (curr === null && prev) prev.clear();
});

/** Whether the decryption cache is encrypted and still waiting for a password */
export const decryptionCacheLocked$ = decryptionCache$.pipe(
  map((cache) => cache instanceof EncryptedStorage && !cache.unlocked),
  distinctUntilChanged(),
);

// Observable for decryption cache statistics
export const decryptionCacheStats$ = decryptionCache$.pipe(
  defined(),
  switchMap(async (cache) => {
    // Get the underlying localforage instance
    const kv = cache instanceof EncryptedStorage ? cache.database : cache;
    const keys = await kv.keys();
    const totalEntries = keys.length;

    // Estimate size by checking a sample of entries
    let estimatedSize = 0;
    const sampleSize = Math.min(10, keys.length);

    for (let i = 0; i < sampleSize; i++) {
      try {
        const value = await kv.getItem(keys[i]);
        if (value) {
          const serialized = JSON.stringify(value);
          estimatedSize += new Blob([serialized]).size;
        }
      } catch (e) {
        // The raw record at this key could not be read for sizing (kv is the raw localforage
        // instance here, not the EncryptedStorage wrapper, so this never attempts decryption).
        // Keep sampling the remaining keys.
        log("Failed to read cache entry for size estimate", keys[i], e);
      }
    }

    // Scale up the estimate
    if (sampleSize > 0 && totalEntries > 0) {
      estimatedSize = Math.round((estimatedSize / sampleSize) * totalEntries);
    }

    // Check encryption and lock status
    const isEncrypted = cache instanceof EncryptedStorage;
    const isLocked = cache instanceof EncryptedStorage ? !cache.unlocked : false;

    return {
      totalEntries,
      estimatedSize,
      isEncrypted,
      isLocked,
    };
  }),
  shareReplay(1),
);

// Fallback method for auto decrypting messages
async function autoDecryptMessagesFallback(event: NostrEvent) {
  if (localSettings.autoDecryptMessages.value === false || !accounts.active) return;
  const account = accounts.active;

  // Unlock legacy messages
  if (
    event.kind === kinds.EncryptedDirectMessage &&
    (event.pubkey === account.pubkey || getLegacyMessageCorrespondent(event, account.pubkey) === account.pubkey)
  ) {
    return unlockLegacyMessage(event, account.pubkey, account);
  }

  // Unlock gift wraps to user, skipping ones that already failed so they don't prompt the signer again
  if (
    event.kind === kinds.GiftWrap &&
    (event.pubkey === account.pubkey || event.tags.find(isPTag)?.[1] === account.pubkey) &&
    !isGiftWrapFailed(event.id)
  ) {
    return unlockGiftWrap(event, account).catch((error) => {
      if (!isSignerRejection(error)) markGiftWrapFailed(event.id);
      throw error;
    });
  }
}

// Save all encrypted content to the cache
decryptionCache$
  .pipe(
    defined(),
    // NOTE: Wrap this in a new Observable so the "stop" method returned from persistEncryptedContent will be called when cache changes
    switchMap((cache) => new Observable(() => persistEncryptedContent(eventStore, cache, autoDecryptMessagesFallback))),
  )
  .subscribe();
