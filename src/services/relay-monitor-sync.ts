import { IAccount } from "applesauce-accounts";
import { ReadonlyAccount } from "applesauce-accounts/accounts";
import { castUser } from "applesauce-common/casts";
import { AppDataFactory } from "applesauce-common/factories";
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
  combineLatest,
  distinctUntilChanged,
  firstValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
} from "rxjs";

import { MAX_LIVENESS_MONITORS } from "../const";
import { logger } from "../helpers/debug";
import { isSignerRejection } from "../helpers/nostr/gift-wrap-decryption";
import accounts from "./accounts";
import actions from "./actions";
import { eventStore } from "./event-store";
import { autoUnlockEnabled$, registerPendingUnlockCategory } from "./pending-unlock";
import localSettings from "./preferences";

const log = logger.extend("RelayMonitorSync");

export const RELAY_MONITORS_IDENTIFIER = "nostrudel-relay-monitors";
const PENDING_UNLOCK_ID = "relay-monitors";
const BASE_STORAGE_KEY = "nostrudel:relay-monitors:synced";

/**
 * - `device`: no account that can sign, the monitors stay on this device
 * - `locked`: the synced monitors exist but have not been decrypted yet
 * - `unsynced`: this device's monitors differ from the published ones
 */
export type RelayMonitorSyncStatus = "device" | "locked" | "unsynced" | "syncing" | "synced";

type RelayMonitorsData = { monitors: string[] };

/** The last monitors this device and the account agreed on, and the event they came from */
type SyncBase = { eventId?: string; monitors?: string[] };

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((value, i) => value === b[i]);

function readBase(pubkey: string): SyncBase {
  try {
    const parsed = JSON.parse(localStorage.getItem(`${BASE_STORAGE_KEY}:${pubkey}`) ?? "null");
    return {
      eventId: typeof parsed?.eventId === "string" ? parsed.eventId : undefined,
      monitors: Array.isArray(parsed?.monitors) ? parsed.monitors : undefined,
    };
  } catch {
    return {};
  }
}

/** Emits whenever a base is written so the status is recomputed */
const baseChanged$ = new BehaviorSubject<void>(undefined);

function writeBase(pubkey: string, base: SyncBase) {
  localStorage.setItem(`${BASE_STORAGE_KEY}:${pubkey}`, JSON.stringify(base));
  baseChanged$.next();
}

function parseMonitors(data: unknown): string[] {
  const monitors = (data as Partial<RelayMonitorsData> | undefined)?.monitors;
  if (!Array.isArray(monitors)) return [];
  return monitors
    .filter((m): m is string => typeof m === "string" && /^[0-9a-f]{64}$/.test(m))
    .slice(0, MAX_LIVENESS_MONITORS);
}

function isLocked(event: NostrEvent) {
  return !!getAppDataEncryption(event) && !isAppDataUnlocked(event);
}

/** The active account when it can sign and decrypt, otherwise undefined */
const syncAccount$: Observable<IAccount | undefined> = accounts.active$.pipe(
  map((account) => (account && !(account instanceof ReadonlyAccount) ? account : undefined)),
  distinctUntilChanged((a, b) => a?.id === b?.id),
  shareReplay(1),
);

/** Loads the account's synced monitors event from its outboxes and re-emits when it is decrypted */
function getSyncEvent$(pubkey: string) {
  const user = castUser(pubkey, eventStore);
  return user.outboxes$.pipe(
    switchMap((outboxes) => user.replaceable(APP_DATA_KIND, RELAY_MONITORS_IDENTIFIER, outboxes)),
    watchEventUpdates(eventStore),
  );
}

const syncEvent$ = syncAccount$.pipe(
  switchMap((account) =>
    account ? getSyncEvent$(account.pubkey).pipe(map((event) => ({ account, event }))) : of(undefined),
  ),
  shareReplay(1),
);

const syncing$ = new BehaviorSubject(false);

export const relayMonitorSyncStatus$: Observable<RelayMonitorSyncStatus> = combineLatest([
  syncEvent$,
  localSettings.relayLivenessMonitors,
  syncing$,
  baseChanged$,
]).pipe(
  map(([state, monitors, syncing]): RelayMonitorSyncStatus => {
    if (!state) return "device";
    if (syncing) return "syncing";

    const base = readBase(state.account.pubkey);
    if (state.event && state.event.id !== base.eventId && isLocked(state.event)) return "locked";
    return base.monitors && sameList(base.monitors, monitors) ? "synced" : "unsynced";
  }),
  distinctUntilChanged(),
  shareReplay(1),
);

/** Applies a decrypted synced event to this device, the published monitors win over local ones */
function applyEvent(pubkey: string, event: NostrEvent) {
  const base = readBase(pubkey);
  if (event.id === base.eventId) return;

  const monitors = parseMonitors(getAppDataContent(event));
  writeBase(pubkey, { eventId: event.id, monitors });
  if (!sameList(monitors, localSettings.relayLivenessMonitors.value))
    localSettings.relayLivenessMonitors.next(monitors);
}

/** Events the signer refused to decrypt this session, so auto unlock does not prompt again */
const rejected = new Set<string>();

/** Decrypts the synced monitors, prompting the signer if they are not in the decryption cache */
export async function unlockRelayMonitors() {
  const state = await firstValueFrom(syncEvent$);
  if (!state?.event) return;

  if (isLocked(state.event)) await unlockAppData(state.event, state.account);
  applyEvent(state.account.pubkey, state.event);
}

/** Encrypts and publishes this device's monitors to the active account */
export async function publishRelayMonitors() {
  const account = await firstValueFrom(syncAccount$);
  if (!account) return;

  const monitors = localSettings.relayLivenessMonitors.value;
  syncing$.next(true);
  try {
    await actions.run(() => async ({ signer, self, publish }) => {
      const data: RelayMonitorsData = { monitors };
      const signed = await AppDataFactory.create(RELAY_MONITORS_IDENTIFIER, null)
        .as(signer)
        .encryptedContent(self, JSON.stringify(data), "nip44")
        .sign();

      // Record the base before the event reaches the store so it is not applied back as remote
      writeBase(self, { eventId: signed.id, monitors });
      await publish(signed);
    });
  } finally {
    syncing$.next(false);
  }
}

/** Sets the monitors on this device and publishes them, keeping the local change if publishing fails */
export async function setRelayLivenessMonitors(monitors: string[]) {
  await localSettings.relayLivenessMonitors.next(monitors);
  await publishRelayMonitors();
}

// Apply the synced monitors once they are decrypted, by the decryption cache or the signer
syncEvent$.subscribe((state) => {
  if (!state?.event || isLocked(state.event)) return;
  applyEvent(state.account.pubkey, state.event);
});

// Decrypt automatically when the user opted in, without prompting again after a refusal
combineLatest([syncEvent$, autoUnlockEnabled$(PENDING_UNLOCK_ID)]).subscribe(([state, auto]) => {
  const event = state?.event;
  if (!auto || !event || !isLocked(event) || rejected.has(event.id)) return;
  if (event.id === readBase(state.account.pubkey).eventId) return;

  unlockAppData(event, state.account).catch((error) => {
    if (isSignerRejection(error)) rejected.add(event.id);
    log("Failed to decrypt synced relay monitors", error);
  });
});

registerPendingUnlockCategory({
  id: PENDING_UNLOCK_ID,
  label: "Relay monitors",
  description: "The encrypted list of relay monitors you picked, synced between devices",
  count$: relayMonitorSyncStatus$.pipe(
    map((status) => (status === "locked" ? 1 : 0)),
    distinctUntilChanged(),
  ),
  canUnlock$: syncAccount$.pipe(map((account) => !!account)),
  unlock: unlockRelayMonitors,
});
