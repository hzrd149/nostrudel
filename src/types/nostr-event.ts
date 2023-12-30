export type ETag = ["e", string] | ["e", string, string] | ["e", string, string, string];
export type ATag = ["a", string] | ["a", string, string];
export type PTag = ["p", string] | ["p", string, string] | ["p", string, string, string];
export type RTag = ["r", string] | ["r", string, string];
export type DTag = ["d"] | ["d", string];
export type ExpirationTag = ["expiration", string];
export type EmojiTag = ["emoji", string, string];
export type Tag = string[] | ETag | PTag | RTag | DTag | ATag | ExpirationTag;

export type NostrEvent = {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: Tag[];
  content: string;
  sig: string;
};
export type CountResponse = {
  count: number;
  approximate?: boolean;
};

export type DraftNostrEvent = Omit<NostrEvent, "pubkey" | "id" | "sig"> & { pubkey?: string; id?: string };

export type RawIncomingEvent = ["EVENT", string, NostrEvent];
export type RawIncomingNotice = ["NOTICE", string];
export type RawIncomingCount = ["COUNT", string, CountResponse];
export type RawIncomingEOSE = ["EOSE", string];
export type RawIncomingCommandResult = ["OK", string, boolean, string];
export type RawIncomingNostrEvent =
  | RawIncomingEvent
  | RawIncomingNotice
  | RawIncomingCount
  | RawIncomingEOSE
  | RawIncomingCommandResult;

export function isETag(tag: Tag): tag is ETag {
  return tag[0] === "e" && tag[1] !== undefined;
}
export function isPTag(tag: Tag): tag is PTag {
  return tag[0] === "p" && tag[1] !== undefined;
}
export function isRTag(tag: Tag): tag is RTag {
  return tag[0] === "r" && tag[1] !== undefined;
}
export function isDTag(tag: Tag): tag is DTag {
  return tag[0] === "d";
}
export function isATag(tag: Tag): tag is ATag {
  return tag[0] === "a" && tag[1] !== undefined;
}
export function isEmojiTag(tag: Tag): tag is EmojiTag {
  return tag[0] === "emoji" && tag[1] !== undefined && tag[2] !== undefined;
}
