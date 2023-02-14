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
