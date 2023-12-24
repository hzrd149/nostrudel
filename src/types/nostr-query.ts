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
  "#b"?: string[];
  "#c"?: string[];
  "#d"?: string[];
  "#e"?: string[];
  "#f"?: string[];
  "#g"?: string[];
  "#h"?: string[];
  "#i"?: string[];
  "#j"?: string[];
  "#k"?: string[];
  "#l"?: string[];
  "#m"?: string[];
  "#n"?: string[];
  "#o"?: string[];
  "#p"?: string[];
  "#q"?: string[];
  "#r"?: string[];
  "#s"?: string[];
  "#t"?: string[];
  "#u"?: string[];
  "#v"?: string[];
  "#w"?: string[];
  "#x"?: string[];
  "#y"?: string[];
  "#z"?: string[];
  since?: number;
  until?: number;
  limit?: number;
  search?: string;
};

export type NostrRequestFilter = NostrQuery | NostrQuery[];

export type RelayQueryMap = Record<string, NostrRequestFilter>;
