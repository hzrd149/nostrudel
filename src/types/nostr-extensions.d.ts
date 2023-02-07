import { DraftNostrEvent, NostrEvent } from "./nostr-event";

declare global {
  interface Window {
    nostr?: {
      enabled: boolean;
      getPublicKey: () => Promise<string> | string;
      signEvent: (event: DraftNostrEvent) => Promise<NostrEvent> | NostrEvent;
      getRelays: () => Record<string, { read: boolean; write: boolean }> | string[];
      nip04?: {
        encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
        decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
      };
    };
  }
}
