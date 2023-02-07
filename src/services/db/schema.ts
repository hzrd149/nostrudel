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
      contacts: {
        pubkey: string;
        relay?: string;
      }[];
      created_at: number;
    };
  };
  "text-events": {
    key: string;
    value: NostrEvent;
    indexes: { created_at: number; pubkey: string; kind: number };
  };
  "events-seen": {
    key: string;
    value: {
      id: string;
      relays: string[];
      lastSeen: Date;
    };
    indexes: { lastSeen: Date };
  };
  settings: {
    key: string;
    value: any;
  };
}
