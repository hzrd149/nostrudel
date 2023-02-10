import { DBSchema } from "idb";
import { NostrEvent } from "../../types/nostr-event";
import { RelayInformationDocument } from "../relay-info";

export interface CustomSchema extends DBSchema {
  userMetadata: {
    key: string;
    value: NostrEvent;
    indexes: { created_at: number };
  };
  userContacts: {
    key: string;
    value: {
      pubkey: string;
      relays: Record<string, { read: boolean; write: boolean }>;
      contacts: string[];
      contactRelay: Record<string, string | undefined>;
      created_at: number;
    };
    indexes: { created_at: number; contacts: string };
  };
  userRelays: {
    key: string;
    value: { pubkey: string; relays: { url: string; mode: number }[]; created_at: number };
    indexes: { created_at: number };
  };
  dnsIdentifiers: {
    key: string;
    value: { name: string; domain: string; pubkey: string; relays: string[]; updated: number };
    indexes: { name: string; domain: string; pubkey: string; updated: number };
  };
  relayInfo: { key: string; value: RelayInformationDocument };
  pubkeyRelayWeights: {
    key: string;
    value: { pubkey: string; relays: Record<string, number>; updated: number };
    indexes: { pubkey: string };
  };
  settings: {
    key: string;
    value: any;
  };
}
