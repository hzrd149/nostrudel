import { NostrEvent } from "./nostr-event";

export type NostrOutgoingEvent = ["EVENT", NostrEvent];
export type NostrOutgoingRequest = ["REQ", string, ...NostrQuery[]];
export type NostrOutgoingCount = ["COUNT", string, ...NostrQuery[]];
export type NostrOutgoingClose = ["CLOSE", string];

export type NostrOutgoingMessage = NostrOutgoingEvent | NostrOutgoingRequest | NostrOutgoingClose | NostrOutgoingCount;

export type NostrQuery = {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  "#a"?: string[];
  "#d"?: string[];
  "#e"?: string[];
  "#g"?: string[];
  "#i"?: string[];
  "#k"?: string[];
  "#l"?: string[];
  "#p"?: string[];
  "#r"?: string[];
  "#t"?: string[];
  "#r"?: string[];
  "#l"?: string[];
  "#g"?: string[];
  "#m"?: string[];
  since?: number;
  until?: number;
  limit?: number;
  search?: string;
};

export type NostrRequestFilter = NostrQuery | NostrQuery[];

export type RelayQueryMap = Record<string, NostrRequestFilter>;
