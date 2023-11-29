import { DBSchema } from "idb";
import { NostrEvent } from "../../types/nostr-event";
import { RelayInformationDocument } from "../relay-info";
import { AppSettings } from "../settings/migrations";

export interface SchemaV1 extends DBSchema {
  userMetadata: {
    key: string;
    value: NostrEvent;
    indexes: { created_at: number };
  };
  userContacts: {
    key: string;
    value: NostrEvent;
    indexes: { created_at: number };
  };
  userRelays: {
    key: string;
    value: NostrEvent;
    indexes: { created_at: number };
  };
  userFollows: {
    key: string;
    value: { pubkey: string; follows: string[] };
    indexes: { follows: string };
  };
  dnsIdentifiers: {
    key: string;
    value: { name: string; domain: string; pubkey: string; relays: string[]; updated: number };
    indexes: { name: string; domain: string; pubkey: string; updated: number };
  };
  relayInfo: { key: string; value: RelayInformationDocument };
  relayScoreboardStats: {
    key: string;
    value: {
      relay: string;
      responseTimes?: [number, Date][];
      ejectTimes?: [number, Date][];
      connectionTimes?: [number, Date][];
      timeouts?: Date[];
    };
  };
  settings: {
    key: string;
    value: any;
  };
  accounts: {
    key: string;
    value: {
      pubkey: string;
      readonly: boolean;
      relays?: string[];
      secKey?: ArrayBuffer;
      iv?: Uint8Array;
      useExtension?: boolean;
      localSettings?: AppSettings;
    };
  };
}

export interface SchemaV2 extends SchemaV1 {
  accounts: SchemaV1["accounts"];
  settings: {
    key: string;
    value: NostrEvent;
    indexes: { created_at: number };
  };
  misc: {
    key: string;
    value: any;
  };
}

export interface SchemaV3 {
  accounts: SchemaV2["accounts"];
  replaceableEvents: {
    key: string;
    value: {
      addr: string;
      created: number;
      event: NostrEvent;
    };
  };
  userFollows: SchemaV2["userFollows"];
  dnsIdentifiers: SchemaV2["dnsIdentifiers"];
  relayInfo: SchemaV2["relayInfo"];
  relayScoreboardStats: SchemaV2["relayScoreboardStats"];
  misc: SchemaV2["misc"];
}

export interface SchemaV4 {
  accounts: SchemaV3["accounts"];
  replaceableEvents: SchemaV3["replaceableEvents"];
  dnsIdentifiers: SchemaV3["dnsIdentifiers"];
  relayInfo: SchemaV3["relayInfo"];
  relayScoreboardStats: SchemaV3["relayScoreboardStats"];
  userSearch: {
    key: string;
    value: {
      pubkey: string;
      names: string[];
    };
  };
  misc: SchemaV3["misc"];
}

export interface SchemaV5 {
  accounts: {
    pubkey: string;
    readonly: boolean;
    relays?: string[];
    secKey?: ArrayBuffer;
    iv?: Uint8Array;
    connectionType?: "extension" | "serial";
    localSettings?: AppSettings;
  };
  replaceableEvents: SchemaV4["replaceableEvents"];
  dnsIdentifiers: SchemaV4["dnsIdentifiers"];
  relayInfo: SchemaV4["relayInfo"];
  relayScoreboardStats: SchemaV4["relayScoreboardStats"];
  userSearch: SchemaV4["userSearch"];
  misc: SchemaV4["misc"];
}
