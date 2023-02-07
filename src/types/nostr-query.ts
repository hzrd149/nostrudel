import { NostrEvent } from "./nostr-event";

export type NostrOutgoingEvent = ["EVENT", NostrEvent];
export type NostrOutgoingRequest = ["REQ", string, NostrQuery];
export type NostrOutgoingClose = ["CLOSE", string];

export type NostrOutgoingMessage =
  | NostrOutgoingEvent
  | NostrOutgoingRequest
  | NostrOutgoingClose;

export type NostrQuery = {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  // "#e": <a list of event ids that are referenced in an "e" tag>,
  // "#p": <a list of pubkeys that are referenced in a "p" tag>,
  since?: number;
  until?: number;
  limit?: number;
};
