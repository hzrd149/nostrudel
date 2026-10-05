import { WebLNProvider } from "webln";

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
