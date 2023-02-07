import { DBSchema } from "idb";
import { NostrEvent } from "../../types/nostr-event";

export interface CustomSchema extends DBSchema {
  userMetadata: {
    key: string;
    value: NostrEvent;
  };
  userContacts: {
    key: string;
    value: {
      pubkey: string;
      relays: Record<string, { read: boolean; write: boolean }>;
      contacts: string[];
      contactRelay: Record<string, string | undefined>;
      created_at: number;
    };
    indexes: { created_at: number; contacts: string };
  };
  dnsIdentifiers: {
    key: string;
    value: { name: string; domain: string; pubkey: string; relays: string[]; updated: number };
    indexes: { name: string; domain: string; pubkey: string; updated: number };
  };
  pubkeyRelayWeights: {
    key: string;
    value: { pubkey: string; relays: Record<string, number>; updated: number };
    indexes: { pubkey: string };
  };
  settings: {
    key: string;
    value: any;
  };
}
