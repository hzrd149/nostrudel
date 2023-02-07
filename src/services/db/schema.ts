import { DBSchema } from "idb";

export interface CustomSchema extends DBSchema {
  "user-metadata": {
    key: string;
    value: any;
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
