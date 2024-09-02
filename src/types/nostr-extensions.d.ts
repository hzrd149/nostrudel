import { EventTemplate, NostrEvent, UnsignedEvent, VerifiedEvent } from "nostr-tools";

export type Nip07Signer = {
  getPublicKey: () => Promise<string> | string;
  signEvent: (template: EventTemplate) => Promise<VerifiedEvent> | VerifiedEvent;
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

declare global {
  interface Window {
    nostr?: Nip07Signer;
  }
}
