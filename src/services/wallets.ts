import { parseBolt11, parseLNURLOrAddress } from "applesauce-common/helpers";
import type { ISigner } from "applesauce-signers";
import { WalletConnect } from "applesauce-wallet-connect";
import type { Transaction } from "applesauce-wallet-connect/helpers";
import { NutWallet, WalletStatus } from "applesauce-wallet/wallet";
import {
  BehaviorSubject,
  combineLatest,
  filter,
  firstValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  Subscription,
  switchMap,
  take,
  timeout,
} from "rxjs";

import { logger } from "../helpers/debug";
import accounts from "./accounts";
import couch from "./cashu-couch";
import { eventStore } from "./event-store";
import pool from "./pool";
import localSettings, { type StoredNwcWallet } from "./preferences";

const log = logger.extend("Wallets");

// Suggested mints + relays used when creating a brand new NIP-60 wallet (setup flow, not built yet)
const SUGGESTED_MINTS = ["https://mint.minibits.cash/Bitcoin", "https://21mint.me"];
const DEFAULT_WALLET_RELAYS = ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"];

// Route the Nostr Wallet Connect transport through the shared relay pool
WalletConnect.pool = pool;

export type WalletBackendType = "webln" | "nwc" | "nutwallet";

/** The result of creating an invoice: the bolt11 string plus a promise that resolves once it is paid */
export type ReceiveResult = { invoice: string; paid: Promise<void> };

/** A unified interface every wallet type (WebLN, NWC, NIP-60) implements */
export interface WalletBackend {
  id: string;
  type: WalletBackendType;
  name: string;
  /** Balance in sats, or undefined while unknown/loading */
  balance$: Observable<number | undefined>;
  /** Re-poll the balance */
  refresh(): Promise<void>;
  /**
   * Create a bolt11 invoice to add sats to this wallet. Returns the invoice plus a `paid` promise that
   * resolves when that specific invoice is paid (and rejects if `options.signal` aborts).
   */
  makeInvoice(sats: number, options?: { description?: string; signal?: AbortSignal }): Promise<ReceiveResult>;
  /** Pay a bolt11 invoice from this wallet */
  payInvoice(invoice: string): Promise<void>;
  dispose(): void;
}

export const WALLET_TYPE_LABELS: Record<WalletBackendType, string> = {
  webln: "WebLN",
  nwc: "Nostr Wallet Connect",
  nutwallet: "Cashu (NIP-60)",
};

// Stable ids for the auto-detected single-instance wallets
const WEBLN_ID = "webln";
const nutWalletId = (pubkey: string) => `nutwallet:${pubkey}`;

const abortError = () => new DOMException("Aborted", "AbortError");

/**
 * WebLN has no standard "invoice paid" event, so this is the one backend that detects payment by watching
 * its balance rise (polling `refresh` to keep balance$ fresh).
 */
function awaitBalanceIncrease(
  balance$: Observable<number | undefined>,
  refresh: () => Promise<void>,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());

    let baseline: number | undefined;
    const cleanup = () => {
      sub.unsubscribe();
      clearInterval(interval);
      signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      cleanup();
      reject(abortError());
    };

    const sub = balance$.subscribe((balance) => {
      if (balance === undefined) return;
      if (baseline === undefined) baseline = balance;
      else if (balance > baseline) {
        cleanup();
        resolve();
      }
    });
    const interval = setInterval(() => refresh().catch(() => {}), 3000);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

// ---- WebLN (window.webln) ----
interface WebLNProvider {
  enable(): Promise<void>;
  getBalance?(): Promise<{ balance: number }>;
  makeInvoice(args: { amount: number | string; defaultMemo?: string }): Promise<{ paymentRequest: string }>;
  sendPayment(invoice: string): Promise<{ preimage: string }>;
}

/** Whether a WebLN provider is currently available on the window */
export function hasWebln(): boolean {
  return !!(window as unknown as { webln?: unknown }).webln;
}

function getWebln(): WebLNProvider {
  const webln = (window as unknown as { webln?: WebLNProvider }).webln;
  if (!webln) throw new Error("No WebLN provider found — install Alby or a compatible extension");
  return webln;
}

/**
 * Builds a backend around `window.webln`. Enabling is lazy (only on first use) so merely opening the
 * settings page does not prompt the extension for permission.
 */
function createWeblnBackend(): WalletBackend {
  let enabled = false;
  const ensureEnabled = async () => {
    if (!enabled) {
      await getWebln().enable();
      enabled = true;
    }
  };

  const balance$ = new BehaviorSubject<number | undefined>(undefined);
  const refresh = async () => {
    try {
      await ensureEnabled();
      const webln = getWebln();
      if (webln.getBalance) balance$.next((await webln.getBalance()).balance);
    } catch (error) {
      log("WebLN getBalance failed:", error);
    }
  };

  return {
    id: WEBLN_ID,
    type: "webln",
    name: WALLET_TYPE_LABELS.webln,
    balance$,
    refresh,
    makeInvoice: async (sats, options) => {
      await ensureEnabled();
      const { paymentRequest } = await getWebln().makeInvoice({ amount: sats, defaultMemo: options?.description });
      // No standard WebLN paid event, so fall back to watching the balance rise
      return { invoice: paymentRequest, paid: awaitBalanceIncrease(balance$, refresh, options?.signal) };
    },
    payInvoice: async (invoice) => {
      await ensureEnabled();
      await getWebln().sendPayment(invoice);
      await refresh();
    },
    dispose: () => {},
  };
}

// ---- Nostr Wallet Connect (NIP-47) ----
/** Resolves when a `payment_received` notification arrives for the given invoice (rejects on abort) */
function waitForNwcPaid(client: WalletConnect, tx: Transaction, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());

    const cleanup = () => {
      sub.unsubscribe();
      signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      cleanup();
      reject(abortError());
    };

    const sub = client.notifications$.subscribe((notification) => {
      if (
        notification.notification_type === "payment_received" &&
        notification.notification.payment_hash === tx.payment_hash
      ) {
        cleanup();
        resolve();
      }
    });
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function createNwcBackend(stored: StoredNwcWallet): WalletBackend {
  const client = WalletConnect.fromConnectURI(stored.uri);

  const balance$ = new BehaviorSubject<number | undefined>(undefined);
  const refresh = async () => {
    try {
      const { balance } = await client.getBalance();
      balance$.next(Math.floor(balance / 1000)); // msats -> sats
    } catch (error) {
      log("NWC getBalance failed:", error);
    }
  };
  refresh();

  return {
    id: stored.id,
    type: "nwc",
    name: stored.name,
    balance$,
    refresh,
    makeInvoice: async (sats, options) => {
      const tx = await client.makeInvoice(sats * 1000, { description: options?.description }); // amount is msats
      if (!tx.invoice) throw new Error("Wallet did not return an invoice");
      const paid = waitForNwcPaid(client, tx, options?.signal).then(() => refresh());
      return { invoice: tx.invoice, paid };
    },
    payInvoice: async (invoice) => {
      await client.payInvoice(invoice);
      await refresh();
    },
    dispose: () => {},
  };
}

// ---- NIP-60 Cashu wallet (applesauce-wallet NutWallet) ----
/** Wraps a (already started) NutWallet in the unified backend interface */
function nutWalletBackend(wallet: NutWallet, pubkey: string): WalletBackend {
  return {
    id: nutWalletId(pubkey),
    type: "nutwallet",
    name: WALLET_TYPE_LABELS.nutwallet,
    balance$: wallet.totalBalance$,
    refresh: () => wallet.refreshCouch(),
    // Adding sats mints ecash: create a mint quote (lightning invoice), then wait for it to be paid and redeem
    makeInvoice: async (sats, opts) => {
      const mints = await firstValueFrom(
        wallet.mintUrls$.pipe(
          filter((m): m is string[] => !!m && m.length > 0),
          take(1),
          timeout({ first: 10_000 }),
        ),
      );
      const mint = mints[0];
      const quote = await wallet.createMintQuote(mint, sats, opts?.description);
      const paid = wallet
        .waitForMintQuote(mint, quote.quote, { signal: opts?.signal })
        .then(() => wallet.redeemMintQuote(mint, sats, quote));
      return { invoice: quote.request, paid };
    },
    // Sending melts ecash: pick a mint with enough balance and pay the invoice
    payInvoice: async (invoice) => {
      const balance = await firstValueFrom(
        wallet.balance$.pipe(
          filter((b): b is Record<string, number> => !!b),
          take(1),
          timeout({ first: 10_000 }),
        ),
      );
      const parsed = parseBolt11(invoice);
      const sats = parsed.amount ? Math.ceil(parsed.amount / 1000) : 0;
      const mint =
        Object.entries(balance)
          .sort(([, a], [, b]) => b - a)
          .find(([, value]) => value >= sats)?.[0] ?? Object.keys(balance)[0];
      if (!mint) throw new Error("No mint with a balance to pay from");
      await wallet.payInvoice(mint, invoice);
    },
    dispose: () => wallet.stop(),
  };
}

// ---- Auto-detected single wallets: WebLN + NIP-60 ----
/** The WebLN backend, or null when no `window.webln` provider is present */
const weblnBackend$ = new BehaviorSubject<WalletBackend | null>(hasWebln() ? createWeblnBackend() : null);

/** The state of the active account's NIP-60 wallet, used to drive the Cashu settings section */
export type NutWalletState =
  | { status: "signed-out" }
  | { status: "loading" }
  | { status: "missing" }
  | { status: "ready"; backend: WalletBackend };

export const nutWalletState$ = new BehaviorSubject<NutWalletState>({ status: "signed-out" });

/** The active account's NIP-60 wallet instance, or null when signed out */
const nutWalletInstance$ = new BehaviorSubject<NutWallet | null>(null);

/** Whether the active account's NIP-60 wallet is currently decrypted */
export const nutWalletUnlocked$: Observable<boolean> = nutWalletInstance$.pipe(
  switchMap((wallet) => (wallet ? wallet.unlocked$ : of(false))),
  shareReplay(1),
);

let currentNut: { pubkey: string; wallet: NutWallet; backend: WalletBackend; sub: Subscription } | null = null;

function teardownNutWallet() {
  if (!currentNut) return;
  currentNut.sub.unsubscribe();
  currentNut.wallet.stop();
  currentNut = null;
  nutWalletInstance$.next(null);
}

/**
 * Loads a NIP-60 wallet for the active account and tracks whether one actually exists. Switching accounts
 * tears down the old wallet and starts a fresh one; signing out clears it entirely. Decryption is gated by
 * the `autoUnlockNutWallet` preference so the signer is not prompted on load unless the user opted in.
 */
function syncNutWallet() {
  const signer = accounts.active;
  const pubkey = signer?.pubkey;

  // Already tracking this account's wallet
  if (currentNut?.pubkey === pubkey) return;
  teardownNutWallet();

  if (!signer || !pubkey) {
    nutWalletState$.next({ status: "signed-out" });
    return;
  }

  nutWalletState$.next({ status: "loading" });
  const wallet = new NutWallet({
    pubkey,
    signer: signer as ISigner,
    pool,
    eventStore,
    couch,
    autoUnlock: localSettings.autoUnlockNutWallet.value,
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
  nutWalletInstance$.next(wallet);
  wallet.start().catch((error) => log("Failed to start NIP-60 wallet", error));
}

/** Decrypts the active account's NIP-60 wallet, tokens and history (prompts the signer) */
export async function unlockNutWallet(): Promise<void> {
  const wallet = nutWalletInstance$.value;
  if (!wallet) throw new Error("No Cashu wallet is loaded");
  await wallet.unlock();
}

/**
 * Sets whether the NIP-60 wallet auto-decrypts on load and persists the choice. Enabling it also unlocks the
 * currently loaded wallet immediately (the wallet only auto-unlocks on the next load otherwise).
 */
export async function setNutWalletAutoUnlock(enabled: boolean): Promise<void> {
  await localSettings.autoUnlockNutWallet.next(enabled);
  const wallet = nutWalletInstance$.value;
  wallet?.setAutoUnlock(enabled);
  if (enabled && wallet) await wallet.unlock();
}

// ---- Nostr Wallet Connect registry (the only persisted, multi-instance wallets) ----
const nwcInstances = new Map<string, WalletBackend>();
const nwcBackends$ = new BehaviorSubject<WalletBackend[]>([]);

/** Reconciles the loaded NWC backends to the persisted config */
function reconcileNwc(stored: StoredNwcWallet[]) {
  const keep = new Set(stored.map((w) => w.id));

  for (const config of stored) {
    if (!nwcInstances.has(config.id)) {
      try {
        nwcInstances.set(config.id, createNwcBackend(config));
      } catch (error) {
        log("Failed to load NWC wallet", config.id, error);
      }
    }
  }
  for (const [id, backend] of nwcInstances) {
    if (!keep.has(id)) {
      backend.dispose();
      nwcInstances.delete(id);
    }
  }

  nwcBackends$.next([...nwcInstances.values()]);
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
  createNwcBackend(config).dispose();
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

if (import.meta.env.DEV) {
  // @ts-expect-error debug
  window.wallets = {
    wallets$,
    activeWallet$,
    nutWalletState$,
    nutWalletUnlocked$,
    addNwcWallet,
    removeNwcWallet,
    setActiveWallet,
    unlockNutWallet,
    setNutWalletAutoUnlock,
  };
}
