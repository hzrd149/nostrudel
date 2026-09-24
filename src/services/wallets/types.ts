import type { Observable } from "rxjs";

export type WalletBackendType = "webln" | "nwc" | "nutwallet";

/** The result of creating an invoice: the bolt11 string plus a promise that resolves once it is paid */
export type ReceiveResult = { invoice: string; paid: Promise<void> };

/** A normalized transaction entry shown in a wallet's history */
export interface WalletTransaction {
  id: string;
  direction: "in" | "out";
  /** Amount in sats */
  amount: number;
  /** Fees paid in sats */
  fee?: number;
  /** Unix timestamp (seconds) of when the payment settled (or was created) */
  timestamp: number;
  description?: string;
  /** Whether the payment is still pending */
  pending?: boolean;
}

/** A unified interface every wallet type (WebLN, NWC, NIP-60) implements */
export interface WalletBackend {
  id: string;
  type: WalletBackendType;
  name: string;
  /** Balance in sats, or undefined while unknown/loading */
  balance$: Observable<number | undefined>;
  /**
   * Recent transactions, or undefined while loading (refreshed by {@link refresh}).
   * Omitted when the wallet cannot list its history (e.g. WebLN).
   */
  history$?: Observable<WalletTransaction[] | undefined>;
  /** Re-poll the balance (and transaction history when supported) */
  refresh(): Promise<void>;
  /** Change the wallet's display name. Omitted for wallets whose name is a fixed type label (WebLN, NIP-60). */
  rename?(name: string): Promise<void>;
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
