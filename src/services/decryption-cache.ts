import {
  getLegacyMessageCorraspondant,
  isPTag,
  persistEncryptedContent,
  unlockGiftWrap,
  unlockLegacyMessage,
} from "applesauce-core/helpers";
import { defined } from "applesauce-core/observable";
import localforage from "localforage";
import { NostrEvent } from "nostr-social-graph";
import { kinds } from "nostr-tools";
import {
  distinctUntilChanged,
  filter,
  interval,
  map,
  Observable,
  of,
  pairwise,
  shareReplay,
  startWith,
  switchMap,
} from "rxjs";

import EncryptedStorage from "../classes/encrypted-storage";
import accounts from "./accounts";
import { eventStore } from "./event-store";
import localSettings from "./preferences";

export const decryptionCache$ = localSettings.enableDecryptionCache.pipe(
  switchMap((enable) => {
    if (!enable) return of(null);

    // If enabled create a database instance
    return localSettings.encryptDecryptionCache.pipe(
      map((encrypt) => {
        const kv = localforage.createInstance({ name: "decryption-cache" });

        if (encrypt) return new EncryptedStorage(kv);
        else return kv;
      }),
      switchMap((cache) => {
        if (cache instanceof EncryptedStorage) {
          // Create an observable that polls for when the cache is unlocked
          return interval(1000).pipe(
            startWith(cache),
            map(() => cache.unlocked),
            distinctUntilChanged(),
            map(() => cache),
          );
        }
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
    switchMap(() => decryptionCache$),
    defined(),
  )
  .subscribe((cache) => cache.clear());

// Clear cache when its disabled
decryptionCache$.pipe(pairwise()).subscribe(([prev, curr]) => {
  if (curr === null && prev) prev.clear();
});

// Observable for decryption cache statistics
export const decryptionCacheStats$ = localSettings.encryptDecryptionCache.pipe(
  switchMap(() => decryptionCache$),
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
        // Skip encrypted entries we can't read
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
    (event.pubkey === account.pubkey || getLegacyMessageCorraspondant(event, account.pubkey) === account.pubkey)
  ) {
    return unlockLegacyMessage(event, account.pubkey, account);
  }

  // Unlock gift wraps to user
  if (
    event.kind === kinds.GiftWrap &&
    (event.pubkey === account.pubkey || event.tags.find(isPTag)?.[1] === account.pubkey)
  ) {
    return unlockGiftWrap(event, account);
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
