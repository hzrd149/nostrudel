import { DBSchema } from "idb";
import { NostrEvent } from "../../types/nostr-event";

export interface CustomSchema extends DBSchema {
  "user-metadata": {
    key: string;
    value: NostrEvent;
  };
  "user-contacts": {
    key: string;
    value: {
      pubkey: string;
      relays: Record<string, { read: boolean; write: boolean }>;
      contacts: string[];
      // contacts: {
      //   pubkey: string;
      //   relay?: string;
      // }[];
      created_at: number;
    };
    indexes: { created_at: number; contacts: string };
  };
  "dns-identifiers": {
    key: string;
    value: { name: string; domain: string; pubkey: string; relays: string[]; updated: number };
    indexes: { name: string; domain: string; pubkey: string; updated: number };
  };
  settings: {
    key: string;
    value: any;
  };
}
