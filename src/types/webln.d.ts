import { WebLNProvider } from "webln";

// Providers may expose a synchronous enabled flag alongside the standard enable() method.
declare module "@webbtc/webln-types" {
  interface WebLNProvider {
    enabled?: boolean;
  }
}

declare global {
  interface Window {
    webln?: WebLNProvider & {
      enabled?: boolean;
      isEnabled?: boolean;
      /** Optional WebLN method (offered by e.g. Alby) that the `webln` package's typings omit. */
      getBalance?: () => Promise<{ balance: number }>;
      lnurl?: (lnurl: string) => Promise<{ paymentHash: string; preimage: string }>;
    };
  }
}
