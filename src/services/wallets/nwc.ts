import type { Transaction } from "applesauce-wallet-connect/helpers";
import { WalletConnect } from "applesauce-wallet-connect";
import type { Debugger } from "debug";
import { BehaviorSubject } from "rxjs";

import localSettings, { type StoredNwcWallet } from "../preferences";
import type { WalletBackend, WalletTransaction } from "./types";
import { abortError } from "./webln";

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

/** Maps a NIP-47 transaction onto the normalized {@link WalletTransaction} shape (msats -> sats) */
export function fromNwcTransaction(tx: Transaction): WalletTransaction {
  return {
    id: tx.payment_hash || tx.invoice || `${tx.created_at}:${tx.amount}`,
    direction: tx.type === "incoming" ? "in" : "out",
    amount: Math.floor(tx.amount / 1000),
    fee: tx.fees_paid ? Math.floor(tx.fees_paid / 1000) : undefined,
    timestamp: tx.settled_at ?? tx.created_at,
    description: tx.description,
    pending: tx.state === "pending",
  };
}

/** Builds a backend around a persisted Nostr Wallet Connect connection string */
export function createNwcBackend(stored: StoredNwcWallet, log: Debugger): WalletBackend {
  const client = WalletConnect.fromConnectURI(stored.uri);

  const balance$ = new BehaviorSubject<number | undefined>(undefined);
  const history$ = new BehaviorSubject<WalletTransaction[] | undefined>(undefined);
  const refresh = async () => {
    try {
      const { balance } = await client.getBalance();
      balance$.next(Math.floor(balance / 1000)); // msats -> sats
    } catch (error) {
      log("NWC getBalance failed:", error);
    }
    try {
      const { transactions } = await client.listTransactions({ limit: 50 });
      history$.next(
        transactions.filter((tx) => tx.state === "settled" || tx.state === "pending").map(fromNwcTransaction),
      );
    } catch (error) {
      log("NWC listTransactions failed:", error);
    }
  };
  refresh();

  return {
    id: stored.id,
    type: "nwc",
    name: stored.name,
    balance$,
    history$,
    refresh,
    rename: async (name) => {
      await localSettings.wallets.next(
        localSettings.wallets.value.map((w) => (w.id === stored.id ? { ...w, name } : w)),
      );
    },
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
