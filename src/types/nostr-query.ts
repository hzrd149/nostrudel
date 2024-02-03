import { Filter } from "nostr-tools";
import { NostrEvent } from "./nostr-event";

export type NostrOutgoingEvent = ["EVENT", NostrEvent];
export type NostrOutgoingRequest = ["REQ", string, ...Filter[]];
export type NostrOutgoingCount = ["COUNT", string, ...Filter[]];
export type NostrOutgoingClose = ["CLOSE", string];

export type NostrOutgoingMessage = NostrOutgoingEvent | NostrOutgoingRequest | NostrOutgoingClose | NostrOutgoingCount;

/** @deprecated use Filter instead */
export type NostrQuery = Filter;

export type NostrRequestFilter = Filter | Filter[];

export type RelayQueryMap = Record<string, NostrRequestFilter>;
