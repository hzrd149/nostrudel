import { firstValueFrom, map, Observable, of, shareReplay } from "rxjs";

import CacheUnlockForm from "../components/pending-unlock/cache-unlock-form";
import { decryptionCacheStats$ } from "./decryption-cache";
import { registerPendingUnlockCategory } from "./pending-unlock";

/**
 * Number of pending items: 1 while the decryption cache is locked, 0 otherwise. With
 * `encryptDecryptionCache` at its default `true` this reports 1 on every app start until the
 * cache password is entered, reusing the existing `decryptionCacheStats$.isLocked` field — no new
 * cache, storage, or crypto code.
 */
const count$: Observable<number> = decryptionCacheStats$.pipe(
  map((stats) => (stats.isLocked ? 1 : 0)),
  shareReplay(1),
);

/** The cache password is not tied to an account — a read-only account can still unlock it. */
const canUnlock$: Observable<boolean> = of(true);

/**
 * Resolves when the cache is already unlocked or unencrypted. Never reached by the batch/auto
 * unlock path (the category descriptor below defines a self-contained unlock UI, which excludes
 * it from both), so this only guards against silently resolving while the cache is still locked.
 */
async function unlock(): Promise<void> {
  const stats = await firstValueFrom(decryptionCacheStats$);
  if (!stats.isLocked) return;
  throw new Error("The message cache password is required to unlock it");
}

registerPendingUnlockCategory({
  id: "decryption-cache",
  label: "Message cache",
  description: "The encrypted local cache of decrypted content is locked until the password is entered",
  count$,
  canUnlock$,
  unlock,
  unlockComponent: CacheUnlockForm,
});
