import { DBSchema } from "idb";
import { NostrEvent } from "../../types/nostr-event";
import { Account } from "../account";
import { RelayInformationDocument } from "../relay-info";

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
    value: Account;
  };
}

export interface SchemaV2 extends SchemaV1 {
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
