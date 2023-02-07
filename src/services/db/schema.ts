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
      relays: Record<string, { read: boolean; write: boolean }>;
      contacts: {
        pubkey: string;
        relay?: string;
      }[];
      updated: Date;
    };
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
