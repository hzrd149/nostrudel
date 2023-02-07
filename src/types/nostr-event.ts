export type ETag = ["e", string] | ["e", string, string] | ["e", string, string, string];
export type PTag = ["p", string] | ["p", string, string];
export type Tag =
  | [string]
  | [string, string]
  | [string, string, string]
  | [string, string, string, string]
  | ETag
  | PTag;

export type NostrEvent = {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: Tag[];
  content: string;
  sig: string;
};

export type DraftNostrEvent = Omit<NostrEvent, "pubkey" | "id" | "sig">;

export type RawIncomingEvent = ["EVENT", string, NostrEvent];
export type RawIncomingNotice = ["NOTICE", string];
export type RawIncomingEOSE = ["EOSE", string];
export type RawIncomingCommandResult = ["OK", string, boolean, string];
export type RawIncomingNostrEvent = RawIncomingEvent | RawIncomingNotice | RawIncomingEOSE | RawIncomingCommandResult;

export type Kind0ParsedContent = {
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  website?: string;
  lud16?: string;
  lud06?: string;
};

export function isETag(tag: Tag): tag is ETag {
  return tag[0] === "e";
}
export function isPTag(tag: Tag): tag is PTag {
  return tag[0] === "p";
}
