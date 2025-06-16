import { SerializedAccount } from "applesauce-accounts";
import { Identity } from "applesauce-loaders/helpers/dns-identity";
import { NostrEvent } from "nostr-tools";

import { AppSettings } from "../../helpers/app-settings";

export interface SchemaV1 {
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
}

export interface SchemaV2 extends Omit<SchemaV1, "settings"> {
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

export interface SchemaV3 extends Omit<SchemaV2, "settings" | "userMetadata" | "userContacts" | "userRelays"> {
  replaceableEvents: {
    key: string;
    value: {
      addr: string;
      created: number;
      event: NostrEvent;
    };
    indexes: { created: number };
  };
}

export interface SchemaV4 extends Omit<SchemaV3, "userFollows"> {
  userSearch: {
    key: string;
    value: {
      pubkey: string;
      names: string[];
    };
  };
}

export interface SchemaV5 extends Omit<SchemaV4, "accounts"> {
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
}

export interface SchemaV6 extends SchemaV5 {
  channelMetadata: {
    key: string;
    value: {
      channelId: string;
      created: number;
      event: NostrEvent;
    };
  };
}

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

export interface SchemaV7 extends Omit<SchemaV6, "accounts"> {
  accounts: {
    key: string;
    value: AccountV7;
  };
}

export interface SchemaV8 extends Omit<SchemaV7, "replaceableEvents"> {}

export interface SchemaV9 extends SchemaV8 {
  read: {
    key: string;
    value: {
      key: string;
      ttl: number;
      read: boolean;
    };
    indexes: { ttl: number };
  };
}

export interface SchemaV10 extends Omit<SchemaV9, "channelMetadata"> {}

export interface SchemaV11 extends Omit<SchemaV10, "accounts"> {
  accounts: {
    key: string;
    value: SerializedAccount<any, { settings?: AppSettings }>;
  };
}
export interface SchemaV12 extends Omit<SchemaV11, "dnsIdentifiers"> {
  identities: {
    key: string;
    value: Identity;
  };
}

export interface SchemaV13 extends SchemaV12 {
  kv: {
    key: string;
    value: any;
  };
}
