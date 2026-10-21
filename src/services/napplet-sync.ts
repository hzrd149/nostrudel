import { IAccount } from "applesauce-accounts";
import { ReadonlyAccount } from "applesauce-accounts/accounts";
import {
  APP_DATA_KIND,
  getAppDataContent,
  getAppDataEncryption,
  isAppDataUnlocked,
  unlockAppData,
} from "applesauce-common/helpers/app-data";
import { NostrEvent } from "applesauce-core/helpers";
import { watchEventUpdates } from "applesauce-core/observable";
import {
  BehaviorSubject,
  catchError,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  timeout,
} from "rxjs";

import { logger } from "../helpers/debug";
import {
  createNappletSyncEvent,
  EMPTY_NAPPLET_SYNC_DATA,
  isSameNappletSyncData,
  mergeNappletSyncData,
  NAPPLET_SYNC_IDENTIFIER,
  parseNappletSyncData,
  type NappletSyncData,
} from "../helpers/nostr/napplet-sync";
import accounts from "./accounts";
import actions from "./actions";
import { eventStore } from "./event-store";
import {
  applyNappletSyncData,
  getNappletSyncData,
  localNappletChanges$,
  setInstalledNappletScope,
} from "./installed-napplets";
import { registerPendingUnlockCategory } from "./pending-unlock";

const log = logger.extend("NappletSync");

/**
 * - `device`: no account that can sign, installs stay on this device
 * - `locked`: the synced list exists but has not been decrypted yet
 * - `unsynced`: this device has changes that are not published yet
 */
export type NappletSyncStatus = "device" | "locked" | "unsynced" | "syncing" | "synced";

export const nappletSyncStatus$ = new BehaviorSubject<NappletSyncStatus>("device");

/** The last state this device and the account agreed on, and the event it came from */
type SyncBase = { eventId?: string; data: NappletSyncData };

const BASE_STORAGE_KEY = "nostrudel:napplet:synced";

function readBase(pubkey: string): SyncBase {
  try {
    const parsed = JSON.parse(localStorage.getItem(`${BASE_STORAGE_KEY}:${pubkey}`) ?? "null");
    return {
      eventId: typeof parsed?.eventId === "string" ? parsed.eventId : undefined,
      data: parseNappletSyncData(parsed?.data),
    };
  } catch {
    return { data: EMPTY_NAPPLET_SYNC_DATA };
  }
}

function writeBase(pubkey: string, base: SyncBase) {
  localStorage.setItem(`${BASE_STORAGE_KEY}:${pubkey}`, JSON.stringify(base));
}

/** The active account when it can sign and decrypt, otherwise undefined */
const syncAccount$: Observable<IAccount | undefined> = accounts.active$.pipe(
  map((account) => (account && !(account instanceof ReadonlyAccount) ? account : undefined)),
  distinctUntilChanged((a, b) => a?.id === b?.id),
  shareReplay(1),
);

function getSyncEvent$(pubkey: string) {
  return eventStore
    .replaceable({ kind: APP_DATA_KIND, pubkey, identifier: NAPPLET_SYNC_IDENTIFIER })
    .pipe(watchEventUpdates(eventStore));
}

function isLocked(event: NostrEvent) {
  return !!getAppDataEncryption(event) && !isAppDataUnlocked(event);
}

function updateStatus(pubkey: string) {
  const base = readBase(pubkey);
  nappletSyncStatus$.next(isSameNappletSyncData(base.data, getNappletSyncData()) ? "synced" : "unsynced");
}

/** Merges a decrypted synced list into this device's list */
function reconcile(pubkey: string, event: NostrEvent) {
  const base = readBase(pubkey);
  if (event.id === base.eventId) return;

  const remote = parseNappletSyncData(getAppDataContent(event));
  const merged = mergeNappletSyncData(base.data, getNappletSyncData(), remote);

  writeBase(pubkey, { eventId: event.id, data: remote });
  applyNappletSyncData(merged);
}

/** Decrypts (prompting the signer if needed), merges, and publishes this device's installs */
export async function syncInstalledNapplets() {
  const account = await firstValueFrom(syncAccount$);
  if (!account) return;

  nappletSyncStatus$.next("syncing");
  try {
    const event = await firstValueFrom(
      getSyncEvent$(account.pubkey).pipe(
        filter((e) => !!e),
        timeout({ first: 5_000 }),
        catchError(() => of(undefined)),
      ),
    );

    if (event) {
      if (isLocked(event)) await unlockAppData(event, account);
      reconcile(account.pubkey, event);
    }

    const data = getNappletSyncData();
    const base = readBase(account.pubkey);
    if (event && base.eventId === event.id && isSameNappletSyncData(base.data, data)) return;
    if (!event && data.installed.length === 0 && Object.keys(data.handlers).length === 0) return;

    await actions.run(() => async ({ signer, self, publish }) => {
      const signed = await createNappletSyncEvent(signer, data);

      // Record the base before the event reaches the store so it is not merged back in as remote
      writeBase(self, { eventId: signed.id, data });
      await publish(signed);
    });
  } finally {
    updateStatus(account.pubkey);
  }
}

// Switch the installed list to the active account and merge in its synced list as it arrives
syncAccount$
  .pipe(
    switchMap((account) => {
      setInstalledNappletScope(account?.pubkey);
      if (!account) return of({ account, event: undefined });

      return getSyncEvent$(account.pubkey).pipe(map((event) => ({ account, event })));
    }),
  )
  .subscribe(({ account, event }) => {
    if (!account) return nappletSyncStatus$.next("device");
    if (!event) return updateStatus(account.pubkey);

    if (isLocked(event) && event.id !== readBase(account.pubkey).eventId) return nappletSyncStatus$.next("locked");

    reconcile(account.pubkey, event);
    updateStatus(account.pubkey);
  });

// Publish user changes; signing them is part of the install or uninstall the user asked for
localNappletChanges$
  .pipe(
    debounceTime(1_000),
    concatMap(() => syncInstalledNapplets().catch((error) => log("Failed to sync installed napplets", error))),
  )
  .subscribe();

registerPendingUnlockCategory({
  id: "napplets",
  label: "Installed apps",
  description: "The encrypted list of napplets you installed, synced between devices",
  count$: nappletSyncStatus$.pipe(
    map((status) => (status === "locked" ? 1 : 0)),
    distinctUntilChanged(),
  ),
  canUnlock$: syncAccount$.pipe(map((account) => !!account)),
  unlock: syncInstalledNapplets,
});
