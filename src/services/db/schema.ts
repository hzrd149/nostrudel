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
  "text-events": {
    key: string;
    value: NostrEvent;
    indexes: { created_at: number; pubkey: string; kind: number };
  };
  identicon: {
    key: string;
    value: string;
  };
  settings: {
    key: string;
    value: any;
  };
}
