import { Filter } from "nostr-tools";

/** @deprecated use Filter instead */
export type NostrQuery = Filter;

export type NostrRequestFilter = Filter | Filter[];

export type RelayQueryMap = Record<string, Filter[]>;
