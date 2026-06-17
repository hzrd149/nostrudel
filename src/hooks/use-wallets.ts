import { use$ } from "applesauce-react/hooks";

import {
  activeWallet$,
  nutWallet$,
  nutWalletStaleTokenCount$,
  nutWalletState$,
  nutWalletUnlocked$,
  wallets$,
} from "../services/wallets";

/** Returns all usable wallet backends */
export function useWallets() {
  return use$(wallets$) ?? [];
}

/** Returns the currently selected wallet backend, or null */
export function useActiveWallet() {
  return use$(activeWallet$) ?? null;
}

/** Returns the active account's NIP-60 (Cashu) NutWallet instance, or null when signed out */
export function useNutWallet() {
  return use$(nutWallet$) ?? null;
}

/** Returns the state of the active account's NIP-60 (Cashu) wallet */
export function useNutWalletState() {
  return use$(nutWalletState$) ?? { status: "signed-out" as const };
}

/** Returns whether the active account's NIP-60 (Cashu) wallet is currently decrypted */
export function useNutWalletUnlocked() {
  return use$(nutWalletUnlocked$) ?? false;
}

/** Returns the number of stale (deleted-but-still-present) token events in the active NIP-60 wallet */
export function useNutWalletStaleTokenCount() {
  return use$(nutWalletStaleTokenCount$) ?? 0;
}
