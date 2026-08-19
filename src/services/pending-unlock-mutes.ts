import { ReadonlyAccount } from "applesauce-accounts/accounts";
import { isHiddenMutesUnlocked, unlockHiddenMutes } from "applesauce-common/helpers";
import { hasHiddenTags } from "applesauce-core/helpers";
import { watchEventUpdates } from "applesauce-core/observable";
import { kinds } from "nostr-tools";
import { distinctUntilChanged, map, Observable, of, shareReplay, switchMap } from "rxjs";

import accounts from "./accounts";
import { eventStore } from "./event-store";
import { registerPendingUnlockCategory } from "./pending-unlock";

/**
 * Number of pending (locked, hidden) items in the active account's mute list.
 *
 * `watchEventUpdates(eventStore)` is load-bearing, not stylistic: applesauce caches unlock
 * results by mutating symbols on the event object rather than producing a new object, so
 * reference equality alone never changes. Both `unlockHiddenMutes` (direct unlock) and the
 * decryption-cache restore (via `setEncryptedContentCache`) call `notifyEventUpdate`, and this
 * operator is what turns that into a re-emission here — without it the count would go stale
 * after a reload-restore.
 */
const count$: Observable<number> = accounts.active$.pipe(
  switchMap((account) =>
    account
      ? eventStore.replaceable(kinds.Mutelist, account.pubkey).pipe(
          watchEventUpdates(eventStore),
          map((event) => (event && hasHiddenTags(event) && !isHiddenMutesUnlocked(event) ? 1 : 0)),
        )
      : of(0),
  ),
  distinctUntilChanged(),
  shareReplay(1),
);

/**
 * Whether the active account can perform the mute-list unlock. A signer-less `ReadonlyAccount`
 * still contributes its pending count above (so the user can see locked content exists) but
 * cannot unlock it, so consumers should disable the unlock action while still showing it.
 */
const canUnlock$: Observable<boolean> = accounts.active$.pipe(
  map((account) => account !== undefined && !(account instanceof ReadonlyAccount)),
  distinctUntilChanged(),
);

/**
 * Unlocks the active account's hidden mutes. Lets every error propagate (never catches) so the
 * caller's `useAsyncAction` remains the single toast site (D-08).
 */
async function unlock(): Promise<void> {
  const account = accounts.active;
  if (!account) throw new Error("No active account to unlock the mute list with");
  if (account instanceof ReadonlyAccount) throw new Error("Cannot unlock hidden mutes with a read-only account");

  const event = eventStore.getReplaceable(kinds.Mutelist, account.pubkey);
  if (!event) throw new Error("No mute list found for the active account");

  // Already unlocked (e.g. restored from the decryption cache) — nothing to do
  if (isHiddenMutesUnlocked(event)) return;

  await unlockHiddenMutes(event, account);
}

registerPendingUnlockCategory({
  id: "mutes",
  label: "Mute lists",
  description: "Users muted privately in the encrypted half of your mute list",
  count$,
  canUnlock$,
  unlock,
});
