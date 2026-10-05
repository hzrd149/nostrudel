import { SerializedAccount } from "applesauce-accounts";
import { Identity } from "applesauce-loaders/helpers/dns-identity";
import { NostrEvent } from "nostr-tools";

import { AppSettings } from "../../helpers/app-settings";

export type SchemaV1 = {
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
  relayInfo: { key: string; value: any };
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
};

export type SchemaV2 = Omit<SchemaV1, "settings"> & {
  settings: {
    key: string;
    value: NostrEvent;
    indexes: { created_at: number };
  };
  misc: {
    key: string;
    value: any;
  };
};

export type SchemaV3 = Omit<SchemaV2, "settings" | "userMetadata" | "userContacts" | "userRelays"> & {
  replaceableEvents: {
    key: string;
    value: {
      addr: string;
      created: number;
      event: NostrEvent;
    };
    indexes: { created: number };
  };
};

export type SchemaV4 = Omit<SchemaV3, "userFollows"> & {
  userSearch: {
    key: string;
    value: {
      pubkey: string;
      names: string[];
    };
  };
};

export type SchemaV5 = Omit<SchemaV4, "accounts"> & {
  accounts: {
    key: string;
    value: {
      pubkey: string;
      readonly: boolean;
      relays?: string[];
      secKey?: ArrayBuffer;
      iv?: Uint8Array;
      connectionType?: "extension" | "serial" | "amber";
      localSettings?: AppSettings;
    };
  };
};

export type SchemaV6 = SchemaV5 & {
  channelMetadata: {
    key: string;
    value: {
      channelId: string;
      created: number;
      event: NostrEvent;
    };
    indexes: { created: number };
  };
};

type AccountV7 = {
  type: string;
  pubkey: string;
  relays?: string[];
  localSettings?: AppSettings;
  readonly: boolean;
  // local
  secKey?: ArrayBuffer;
  iv?: Uint8Array;
  // nostr-connect
  clientSecretKey?: string;
  signerRelays?: string[];
};

export type SchemaV7 = Omit<SchemaV6, "accounts"> & {
  accounts: {
    key: string;
    value: AccountV7;
  };
};

export type SchemaV8 = Omit<SchemaV7, "replaceableEvents">;

export type SchemaV9 = SchemaV8 & {
  read: {
    key: string;
    value: {
      key: string;
      ttl: number;
      read: boolean;
    };
    indexes: { ttl: number };
  };
};

export type SchemaV10 = Omit<SchemaV9, "channelMetadata">;

export type SchemaV11 = Omit<SchemaV10, "accounts"> & {
  accounts: {
    key: string;
    value: SerializedAccount<any, { settings?: AppSettings }>;
  };
};
export type SchemaV12 = Omit<SchemaV11, "dnsIdentifiers"> & {
  identities: {
    key: string;
    value: Identity;
  };
};

export type SchemaV13 = SchemaV12 & {
  kv: {
    key: string;
    value: any;
  };
};
