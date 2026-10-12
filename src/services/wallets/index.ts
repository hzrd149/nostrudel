import { parseLNURLOrAddress, type EncryptedContentCache } from "applesauce-common/helpers";
import type { ISigner } from "applesauce-signers";
import { WalletConnect } from "applesauce-wallet-connect";
import { NutWallet, WalletStatus } from "applesauce-wallet/wallet";
import { BehaviorSubject, combineLatest, map, Observable, of, shareReplay, Subscription, switchMap } from "rxjs";

import { logger } from "../../helpers/debug";
import accounts from "../accounts";
import couch from "../cashu-couch";
import { decryptionCache$ } from "../decryption-cache";
import { eventStore } from "../event-store";
import pool from "../pool";
import localSettings, { type StoredNwcWallet } from "../preferences";
import { nutWalletBackend } from "./nutwallet";
import { createNwcBackend } from "./nwc";
import { type WalletBackend } from "./types";
import { createWeblnBackend, hasWebln } from "./webln";

export {
  type ReceiveResult,
  WALLET_TYPE_LABELS,
  type WalletBackend,
  type WalletBackendType,
  type WalletTransaction,
} from "./types";
export { hasWebln } from "./webln";

const log = logger.extend("Wallets");

// Route the Nostr Wallet Connect transport through the shared relay pool
WalletConnect.pool = pool;

// ---- Auto-detected single wallets: WebLN + NIP-60 ----
/** The WebLN backend, or null when no `window.webln` provider is present */
const weblnBackend$ = new BehaviorSubject<WalletBackend | null>(hasWebln() ? createWeblnBackend(log) : null);

/** The state of the active account's NIP-60 wallet, used to drive the Cashu settings section */
export type NutWalletState =
  | { status: "signed-out" }
  | { status: "disabled" }
  | { status: "loading" }
  | { status: "missing" }
  | { status: "ready"; backend: WalletBackend };

export const nutWalletState$ = new BehaviorSubject<NutWalletState>({ status: "signed-out" });

/** The active account's NIP-60 wallet instance, or null when signed out */
export const nutWallet$ = new BehaviorSubject<NutWallet | null>(null);

/** Whether the active account's NIP-60 wallet is currently decrypted */
export const nutWalletUnlocked$: Observable<boolean> = nutWallet$.pipe(
  switchMap((wallet) => (wallet ? wallet.unlocked$ : of(false))),
  shareReplay(1),
);

/**
 * The number of stale (deleted-but-still-present) token events in the active NIP-60 wallet. These pile up
 * when delete events are disabled and can be cleaned up with {@link cleanupNutWalletDeletedTokens}.
 */
export const nutWalletStaleTokenCount$: Observable<number> = nutWallet$.pipe(
  switchMap((wallet) => (wallet ? wallet.staleTokenCount$ : of(0))),
  shareReplay(1),
);

let currentNut: { pubkey: string; wallet: NutWallet; backend: WalletBackend; sub: Subscription } | null = null;

// Track the latest decryption cache so a new NIP-60 wallet can be handed it at construction. The wallet
// restores decrypted tokens from this cache before decrypting them itself, avoiding a race where tokens
// would otherwise be re-decrypted before the cache had a chance to restore them.
let decryptionCache: EncryptedContentCache | undefined;
decryptionCache$.subscribe((cache) => (decryptionCache = cache ?? undefined));

function teardownNutWallet() {
  if (!currentNut) return;
  currentNut.sub.unsubscribe();
  currentNut.wallet.stop();
  currentNut = null;
  nutWallet$.next(null);
}

/**
 * Loads a NIP-60 wallet for the active account and tracks whether one actually exists. Switching accounts
 * tears down the old wallet and starts a fresh one; signing out clears it entirely. Decryption is gated by
 * the `autoUnlockNutWallet` preference so the signer is not prompted on load unless the user opted in.
 */
function syncNutWallet() {
  const signer = accounts.active;
  const pubkey = signer?.pubkey;

  if (!signer || !pubkey) {
    teardownNutWallet();
    nutWalletState$.next({ status: "signed-out" });
    return;
  }

  // The wallet has been turned off globally — never load it
  if (!localSettings.enableNutWallet.value) {
    teardownNutWallet();
    nutWalletState$.next({ status: "disabled" });
    return;
  }

  // Already tracking this account's wallet
  if (currentNut?.pubkey === pubkey) return;
  teardownNutWallet();

  nutWalletState$.next({ status: "loading" });
  const wallet = new NutWallet({
    pubkey,
    signer: signer as ISigner,
    pool,
    eventStore,
    couch,
    autoUnlock: localSettings.autoUnlockNutWallet.value,
    decryptionCache,
  });
  const backend = nutWalletBackend(wallet, pubkey);
  const sub = wallet.status$.subscribe((status) => {
    // Ignore updates from a wallet that has since been torn down
    if (currentNut?.wallet !== wallet) return;
    if (status === WalletStatus.Ready) nutWalletState$.next({ status: "ready", backend });
    else if (status === WalletStatus.Missing) nutWalletState$.next({ status: "missing" });
    else nutWalletState$.next({ status: "loading" });
  });
  currentNut = { pubkey, wallet, backend, sub };
  nutWallet$.next(wallet);
  wallet.start().catch((error) => log("Failed to start NIP-60 wallet", error));
}

/**
 * Enables or disables the NIP-60 (Cashu) wallet globally and persists the choice. Disabling tears down the
 * loaded wallet immediately; enabling reloads it for the active account (handled by the subscription below).
 */
export async function setNutWalletEnabled(enabled: boolean): Promise<void> {
  await localSettings.enableNutWallet.next(enabled);
}

/** Decrypts the active account's NIP-60 wallet, tokens and history (prompts the signer) */
export async function unlockNutWallet(): Promise<void> {
  const wallet = nutWallet$.value;
  if (!wallet) throw new Error("No Cashu wallet is loaded");
  await wallet.unlock();
}

/**
 * Sets whether the NIP-60 wallet auto-decrypts on load and persists the choice. Enabling it also unlocks the
 * currently loaded wallet immediately (the wallet only auto-unlocks on the next load otherwise).
 */
export async function setNutWalletAutoUnlock(enabled: boolean): Promise<void> {
  await localSettings.autoUnlockNutWallet.next(enabled);
  const wallet = nutWallet$.value;
  wallet?.setAutoUnlock(enabled);
  if (enabled && wallet) await wallet.unlock();
}

/**
 * Publishes a single NIP-09 (kind 5) delete event covering every stale token event the wallet has left on
 * relays (the deleted-but-still-present token events that accumulate because the wallet does not publish
 * delete events when it spends tokens).
 */
export async function cleanupNutWalletDeletedTokens(): Promise<void> {
  const wallet = nutWallet$.value;
  if (!wallet) throw new Error("No Cashu wallet is loaded");
  await wallet.cleanupDeletedTokens();
}

// Automatically clean up stale token events once they reach the configured threshold (only relevant when
// delete events are disabled). Guarded so a new cleanup is never started while one is already running.
let autoCleanupRunning = false;
combineLatest([nutWalletStaleTokenCount$, localSettings.cleanupNutWalletThreshold]).subscribe(([count, threshold]) => {
  if (threshold == null || count < threshold || autoCleanupRunning) return;
  autoCleanupRunning = true;
  log(`Auto-cleaning up ${count} stale token events (threshold ${threshold})`);
  cleanupNutWalletDeletedTokens()
    .catch((error) => log("Automatic stale token cleanup failed", error))
    .finally(() => (autoCleanupRunning = false));
});

// ---- Nostr Wallet Connect registry (the only persisted, multi-instance wallets) ----
const nwcInstances = new Map<string, { config: StoredNwcWallet; backend: WalletBackend }>();
const nwcBackends$ = new BehaviorSubject<WalletBackend[]>([]);

/** Reconciles the loaded NWC backends to the persisted config */
function reconcileNwc(stored: StoredNwcWallet[]) {
  const keep = new Set(stored.map((w) => w.id));

  for (const config of stored) {
    const existing = nwcInstances.get(config.id);
    if (!existing) {
      try {
        nwcInstances.set(config.id, { config, backend: createNwcBackend(config, log) });
      } catch (error) {
        log("Failed to load NWC wallet", config.id, error);
      }
    } else if (existing.config.uri !== config.uri) {
      // Connection string changed — recreate the backend
      existing.backend.dispose();
      nwcInstances.set(config.id, { config, backend: createNwcBackend(config, log) });
    } else if (existing.config.name !== config.name) {
      // Only the name changed — update it in place so the live backend reflects the rename
      existing.backend.name = config.name;
      existing.config = config;
    }
  }
  for (const [id, { backend }] of nwcInstances) {
    if (!keep.has(id)) {
      backend.dispose();
      nwcInstances.delete(id);
    }
  }

  nwcBackends$.next([...nwcInstances.values()].map((entry) => entry.backend));
}

// ---- Unified, reactive wallet list ----
/** All usable wallet backends: the NIP-60 wallet (if set up), WebLN (if present), and every NWC wallet */
export const wallets$: Observable<WalletBackend[]> = combineLatest([nutWalletState$, weblnBackend$, nwcBackends$]).pipe(
  map(([nut, webln, nwc]) => [...(nut.status === "ready" ? [nut.backend] : []), ...(webln ? [webln] : []), ...nwc]),
  shareReplay(1),
);

/** The currently selected wallet backend; falls back to the first available wallet when none is selected */
export const activeWallet$: Observable<WalletBackend | null> = combineLatest([
  wallets$,
  localSettings.activeWallet,
]).pipe(
  map(([wallets, id]) => wallets.find((b) => b.id === id) ?? wallets[0] ?? null),
  shareReplay(1),
);

/** Creates and persists a new Nostr Wallet Connect wallet, selecting it if no wallet is active */
export async function addNwcWallet(input: { name: string; uri: string }): Promise<void> {
  const config: StoredNwcWallet = { id: crypto.randomUUID(), name: input.name, uri: input.uri };
  // Validate the connection string up-front so a bad URI surfaces an error in the modal
  createNwcBackend(config, log).dispose();
  // Persisting triggers reconcileNwc (subscribed below), which loads the backend
  await localSettings.wallets.next([...localSettings.wallets.value, config]);
  if (!localSettings.activeWallet.value) await localSettings.activeWallet.next(config.id);
}

/** Removes a Nostr Wallet Connect wallet, clearing the active selection if it was the active wallet */
export async function removeNwcWallet(id: string): Promise<void> {
  // Persisting triggers reconcileNwc (subscribed below), which disposes the backend
  await localSettings.wallets.next(localSettings.wallets.value.filter((w) => w.id !== id));
  if (localSettings.activeWallet.value === id) localSettings.activeWallet.clear();
}

/** Selects the active wallet backend by id (any type) */
export async function setActiveWallet(id: string | null): Promise<void> {
  if (id) await localSettings.activeWallet.next(id);
  else localSettings.activeWallet.clear();
}

/** Resolves a bolt11 invoice or a lightning address/LNURL into a bolt11 invoice */
export async function resolveInvoice(input: string, sats?: number): Promise<string> {
  const value = input.trim();
  if (/^ln(bc|tb|bcrt)/i.test(value)) return value; // already a bolt11 invoice

  const url = parseLNURLOrAddress(value);
  if (!url) throw new Error("Not a valid invoice or lightning address");
  if (!sats || sats <= 0) throw new Error("Enter an amount to send to a lightning address");

  const meta = await fetch(url).then((res) => res.json());
  const callback = new URL(meta.callback);
  callback.searchParams.set("amount", String(sats * 1000)); // msats
  const { pr } = await fetch(callback).then((res) => res.json());
  if (!pr) throw new Error("Lightning address did not return an invoice");
  return pr;
}

// Load NWC wallets now and whenever the persisted config changes
localSettings.wallets.subscribe(reconcileNwc);
// Load the NIP-60 wallet for the active account and reload it when the account changes
accounts.active$.subscribe(() => syncNutWallet());
// Reload (or tear down) the NIP-60 wallet whenever it is enabled or disabled
localSettings.enableNutWallet.subscribe(() => syncNutWallet());

if (import.meta.env.DEV) {
  Reflect.set(window, "wallets", {
    wallets$,
    activeWallet$,
    nutWallet$,
    nutWalletState$,
    nutWalletUnlocked$,
    nutWalletStaleTokenCount$,
    addNwcWallet,
    removeNwcWallet,
    setActiveWallet,
    unlockNutWallet,
    setNutWalletEnabled,
    setNutWalletAutoUnlock,
    cleanupNutWalletDeletedTokens,
  });
}
