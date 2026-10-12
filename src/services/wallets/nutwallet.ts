import { parseBolt11 } from "applesauce-common/helpers";
import type { NutWallet } from "applesauce-wallet/wallet";
import { filter, firstValueFrom, take, timeout } from "rxjs";

import { WALLET_TYPE_LABELS, type WalletBackend } from "./types";

// Stable id for a NIP-60 wallet, one per pubkey
const nutWalletId = (pubkey: string) => `nutwallet:${pubkey}`;

// ---- NIP-60 Cashu wallet (applesauce-wallet NutWallet) ----
/** Wraps a (already started) NutWallet in the unified backend interface */
export function nutWalletBackend(wallet: NutWallet, pubkey: string): WalletBackend {
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
