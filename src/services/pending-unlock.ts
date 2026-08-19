import type { ComponentType } from "react";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  firstValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
} from "rxjs";

import localSettings from "./preferences";

/**
 * Substring (lowercased) that a signer-rejection Error message contains. Mirrors the check in
 * src/views/messages/components/pending-decryption-alert.tsx so a user-cancelled decrypt stops a
 * batch unlock instead of firing another signer prompt.
 */
const SIGNER_REFUSAL_SUBSTRING = "user";

/** A source registered with the application-wide pending-unlock registry (D-02). */
export type PendingUnlockCategory = {
  /** Stable identifier, also used as the key into localSettings.autoUnlockCategories */
  id: string;
  /** Human-readable name shown in the nav popover and in Privacy settings */
  label: string;
  /** Optional one-line explanation for the Privacy settings helper text */
  description?: string;
  /** Number of pending-locked items for the active account; 0 when nothing is pending */
  count$: Observable<number>;
  /**
   * false when the active account/session cannot perform the unlock (for example a signer-less
   * account). Consumers show the pending indicator regardless and disable the action.
   */
  canUnlock$: Observable<boolean>;
  /**
   * Unlocks everything pending in the category. Must let errors propagate (throw) — this service
   * never catches-and-toasts; useAsyncAction at the call site is the single toast site (D-08).
   */
  unlock: () => Promise<void>;
  /**
   * Optional self-contained unlock UI for categories that need extra user input (for example a
   * password field). A category that defines this is never auto-unlocked and is never included in
   * the batch unlock.
   */
  unlockComponent?: ComponentType<{ onUnlocked?: () => void }>;
};

/** A derived row combining a registered category with its current count/canUnlock snapshot. */
export type PendingUnlockState = {
  category: PendingUnlockCategory;
  count: number;
  canUnlock: boolean;
};

const categories$ = new BehaviorSubject<PendingUnlockCategory[]>([]);

/** Registers a pending-unlock category, replacing any existing entry with the same id. Returns an unregister function. */
export function registerPendingUnlockCategory(category: PendingUnlockCategory): () => void {
  categories$.next([...categories$.value.filter((c) => c.id !== category.id), category]);
  return () => categories$.next(categories$.value.filter((c) => c.id !== category.id));
}

/** The registry as a read-only observable. */
export const pendingUnlockCategories$: Observable<PendingUnlockCategory[]> = categories$.asObservable();

/** The registry with each category's current count/canUnlock snapshot. */
export const pendingUnlockState$: Observable<PendingUnlockState[]> = categories$.pipe(
  switchMap((cats) =>
    cats.length === 0
      ? of([])
      : combineLatest(
          cats.map((category) =>
            combineLatest([category.count$, category.canUnlock$]).pipe(
              map(([count, canUnlock]) => ({ category, count, canUnlock })),
            ),
          ),
        ),
  ),
  shareReplay(1),
);

/** Sum of pending counts across every registered category. Emits 0 with no categories registered. */
export const pendingUnlockTotal$: Observable<number> = pendingUnlockState$.pipe(
  map((rows) => rows.reduce((sum, row) => sum + row.count, 0)),
  shareReplay(1),
);

// Keep the aggregate warm
pendingUnlockTotal$.subscribe();

/** Whether auto-unlock is enabled for the given category id, reactively. */
export function autoUnlockEnabled$(id: string): Observable<boolean> {
  return combineLatest([localSettings.autoUnlockAll, localSettings.autoUnlockCategories]).pipe(
    map(([all, categories]) => all === true || categories[id] === true),
    distinctUntilChanged(),
  );
}

/** Whether auto-unlock is enabled for the given category id, read synchronously. */
export function isAutoUnlockEnabled(id: string): boolean {
  return localSettings.autoUnlockAll.value === true || localSettings.autoUnlockCategories.value[id] === true;
}

/** Sets (or clears) the per-category auto-unlock preference for the given category id. */
export async function setAutoUnlockCategory(id: string, enabled: boolean): Promise<void> {
  const next = { ...localSettings.autoUnlockCategories.value, [id]: enabled };
  await localSettings.autoUnlockCategories.next(next);
}

/**
 * Unlocks every eligible registered category in sequence (count > 0, canUnlock, no unlockComponent).
 * If a caught Error's lowercased message contains the signer-refusal substring, rethrows immediately
 * so the batch stops rather than firing another signer prompt. Any other error is logged and the loop
 * continues; after the loop the first-seen failure (if any) is thrown for the caller to toast. Never
 * toasts here.
 */
export async function unlockPendingCategories(): Promise<void> {
  const rows = await firstValueFrom(pendingUnlockState$);
  const eligible = rows.filter(
    (row) => row.count > 0 && row.canUnlock && row.category.unlockComponent === undefined,
  );

  let firstError: Error | undefined;
  for (const row of eligible) {
    try {
      await row.category.unlock();
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes(SIGNER_REFUSAL_SUBSTRING)) {
        throw error;
      }

      console.error(`Failed to unlock pending category "${row.category.id}":`, error);
      if (!firstError && error instanceof Error) firstError = error;
    }
  }

  if (firstError) throw firstError;
}
