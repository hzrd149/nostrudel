import { BehaviorSubject } from "rxjs";
import { NostrEvent } from "../types/nostr-event";

declare global {
  interface Window {
    nostr?: {
      enabled: boolean;
      getPublicKey: () => Promise<string> | string;
      signEvent: (event: NostrEvent) => Promise<NostrEvent> | NostrEvent;
      getRelays: () =>
        | Record<string, { read: boolean; write: boolean }>
        | string[];
      nip04?: {
        encrypt: (
          pubkey: string,
          plaintext: string
        ) => Promise<string> | string;
        decrypt: (
          pubkey: string,
          ciphertext: string
        ) => Promise<string> | string;
      };
    };
  }
}

class IdentityService {
  setup = new BehaviorSubject(false);
  pubkey = new BehaviorSubject("");

  async requestKeysFromWindow() {
    if (window.nostr) {
      const pubkey = await window.nostr.getPublicKey();
      this.pubkey.next(pubkey);
      this.setup.next(true);
    }
  }
}

const identity = new IdentityService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.identity = identity;
}

export default identity;
