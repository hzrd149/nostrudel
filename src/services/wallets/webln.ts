import type { Debugger } from "debug";
import { BehaviorSubject, type Observable } from "rxjs";

import { WALLET_TYPE_LABELS, type WalletBackend } from "./types";

// Stable id for the auto-detected single-instance WebLN wallet
const WEBLN_ID = "webln";

/** Shared by every backend that needs to reject a pending wait when its `AbortSignal` fires */
export const abortError = () => new DOMException("Aborted", "AbortError");

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
/** Whether a WebLN provider is currently available on the window */
export function hasWebln(): boolean {
  return !!window.webln;
}

function getWebln(): NonNullable<Window["webln"]> {
  const webln = window.webln;
  if (!webln) throw new Error("No WebLN provider found — install Alby or a compatible extension");
  return webln;
}

/**
 * Builds a backend around `window.webln`. Enabling is lazy (only on first use) so merely opening the
 * settings page does not prompt the extension for permission.
 */
export function createWeblnBackend(log: Debugger): WalletBackend {
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
