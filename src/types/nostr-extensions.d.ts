import { EventTemplate, NostrEvent, UnsignedEvent } from "nostr-tools";

declare global {
  interface Window {
    nostr?: {
      getPublicKey: () => Promise<string> | string;
      signEvent: (event: EventTemplate) => Promise<NostrEvent> | NostrEvent;
      getRelays?: () => Record<string, { read: boolean; write: boolean }> | string[];
      nip04?: {
        encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
        decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
      };
      nip44?: {
        encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
        decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
      };
    };
  }
}
