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

export type IncomingNostrEvent = ["EVENT", string, NostrEvent] | ["NOTICE", string] | ["EOSE", string];

export type Kind0ParsedContent = {
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
};

export function isETag(tag: Tag): tag is ETag {
  return tag[0] === "e";
}
export function isPTag(tag: Tag): tag is PTag {
  return tag[0] === "p";
}
