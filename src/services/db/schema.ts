import { DBSchema } from "idb";
import { NostrEvent } from "../../types/nostr-event";

export interface CustomSchema extends DBSchema {
  "user-metadata": {
    key: string;
    value: NostrEvent;
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
