import { NostrEvent } from "./nostr-event";
import { WebLNProvider } from "webln";

declare global {
  interface Window {
    webln?: WebLNProvider & {
      enabled?: boolean;
      isEnabled?: boolean;
    };
  }
}
