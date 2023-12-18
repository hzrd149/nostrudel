import { Kind, nip19, validateEvent } from "nostr-tools";

import { ATag, DraftNostrEvent, isDTag, isETag, NostrEvent, RTag, Tag } from "../../types/nostr-event";
import { RelayConfig, RelayMode } from "../../classes/relay";
import { getMatchNostrLink } from "../regexp";
import { AddressPointer } from "nostr-tools/lib/types/nip19";
import { safeJson } from "../parse";
import { COMMUNITY_DEFINITION_KIND } from "./communities";

export function truncatedId(str: string, keep = 6) {
  if (str.length < keep * 2 + 3) return str;
  return str.substring(0, keep) + "..." + str.substring(str.length - keep);
}

// based on replaceable kinds from https://github.com/nostr-protocol/nips/blob/master/01.md#kinds
export function isReplaceable(kind: number) {
  return (kind >= 30000 && kind < 40000) || kind === 0 || kind === 3 || kind === 41 || (kind >= 10000 && kind < 20000);
}

// used to get a unique Id for each event, should take into account replaceable events
export function getEventUID(event: NostrEvent) {
  if (isReplaceable(event.kind)) {
    return getEventCoordinate(event);
  }
  return event.id;
}

export function isReply(event: NostrEvent | DraftNostrEvent) {
  if (event.kind === Kind.Repost) return false;
  // TODO: update this to only look for a "root" or "reply" tag
  return !!getReferences(event).replyId;
}
export function isMentionedInContent(event: NostrEvent | DraftNostrEvent, pubkey: string) {
  return filterTagsByContentRefs(event.content, event.tags).some((t) => t[1] === pubkey);
}

export function isRepost(event: NostrEvent | DraftNostrEvent) {
  if (event.kind === Kind.Repost) return true;

  const match = event.content.match(getMatchNostrLink());
  return match && match[0].length === event.content.length;
}

/**
 * returns an array of tag indexes that are referenced in the content
 * either with the legacy #[0] syntax or nostr:xxxxx links
 */
export function getContentTagRefs(content: string, tags: Tag[]) {
  const indexes = new Set();
  Array.from(content.matchAll(/#\[(\d+)\]/gi)).forEach((m) => indexes.add(parseInt(m[1])));

  const linkMatches = Array.from(content.matchAll(getMatchNostrLink()));
  for (const [_, _prefix, link] of linkMatches) {
    try {
      const decoded = nip19.decode(link);

      let type: string;
      let id: string;
      switch (decoded.type) {
        case "npub":
          id = decoded.data;
          type = "p";
          break;
        case "nprofile":
          id = decoded.data.pubkey;
          type = "p";
          break;
        case "note":
          id = decoded.data;
          type = "e";
          break;
        case "nevent":
          id = decoded.data.id;
          type = "e";
          break;
      }

      let t = tags.find((t) => t[0] === type && t[1] === id);
      if (t) {
        let index = tags.indexOf(t);
        indexes.add(index);
      }
    } catch (e) {}
  }

  return Array.from(indexes);
}

export function filterTagsByContentRefs(content: string, tags: Tag[], referenced = true) {
  const contentTagRefs = getContentTagRefs(content, tags);

  const newTags: Tag[] = [];
  for (let i = 0; i < tags.length; i++) {
    if (contentTagRefs.includes(i) === referenced) {
      newTags.push(tags[i]);
    }
  }
  return newTags;
}

function isCommunityRefTag(t: Tag): t is ATag {
  return t.length >= 2 && t[0] === "a" && t[1].startsWith(COMMUNITY_DEFINITION_KIND + ":");
}

export type EventReferences = ReturnType<typeof getReferences>;
export function getReferences(event: NostrEvent | DraftNostrEvent) {
  const contentTagRefs = getContentTagRefs(event.content, event.tags);

  // find the root and reply tags.
  // NOTE: Ignore community reference tags since there is another client out there that is marking them as "root"
  // and it dose not make sense to "reply" to a community
  const replyTag = event.tags.find((t) => !isCommunityRefTag(t) && t[3] === "reply");
  const rootTag = event.tags.find((t) => !isCommunityRefTag(t) && t[3] === "root");
  const mentionTags = event.tags.find((t) => t[3] === "mention");

  let replyId = replyTag?.[1];
  let replyRelay = replyTag?.[2];
  let rootId = rootTag?.[1];
  let rootRelay = rootTag?.[2];

  if (!rootId || !replyId) {
    // a direct reply dose not need a "reply" reference
    // https://github.com/nostr-protocol/nips/blob/master/10.md

    // this is not necessarily to spec. but if there is only one id (root or reply) then assign it to both
    // this handles the cases where a client only set a "reply" tag and no root
    rootId = replyId = rootId || replyId;
  }

  // legacy behavior
  // https://github.com/nostr-protocol/nips/blob/master/10.md#positional-e-tags-deprecated
  const legacyTags = event.tags.filter(isETag).filter((t, i) => {
    // ignore it if there is a type
    if (t[3]) return false;
    const tagIndex = event.tags.indexOf(t);
    if (contentTagRefs.includes(tagIndex)) return false;
    return true;
  });
  if (!rootId && !replyId && legacyTags.length >= 1) {
    // console.info(`Using legacy threading behavior for ${event.id}`, event);

    // first tag is the root
    rootId = legacyTags[0][1];
    // last tag is reply
    replyId = legacyTags[legacyTags.length - 1][1] ?? rootId;
  }

  return {
    replyTag,
    rootTag,
    mentionTags,

    rootId,
    rootRelay,
    replyId,
    replyRelay,

    contentTagRefs,
  };
}

export function parseRTag(tag: RTag): RelayConfig {
  switch (tag[2]) {
    case "write":
      return { url: tag[1], mode: RelayMode.WRITE };
    case "read":
      return { url: tag[1], mode: RelayMode.READ };
    default:
      return { url: tag[1], mode: RelayMode.ALL };
  }
}

export function getEventCoordinate(event: NostrEvent) {
  const d = event.tags.find(isDTag)?.[1];
  return d ? `${event.kind}:${event.pubkey}:${d}` : `${event.kind}:${event.pubkey}`;
}
export function getEventAddressPointer(event: NostrEvent): AddressPointer {
  const { kind, pubkey } = event;
  if (!isReplaceable(kind)) throw new Error("Event is not replaceable");
  const identifier = event.tags.find(isDTag)?.[1];
  if (!identifier) throw new Error("Missing identifier");
  return { kind, pubkey, identifier };
}
export function pointerToATag(pointer: AddressPointer): ATag {
  const relay = pointer.relays?.[0];
  const coordinate = `${pointer.kind}:${pointer.pubkey}:${pointer.identifier}`;
  return relay ? ["a", coordinate, relay] : ["a", coordinate];
}

export type CustomEventPointer = Omit<AddressPointer, "identifier"> & {
  identifier?: string;
};

export function parseCoordinate(a: string): CustomEventPointer | null;
export function parseCoordinate(a: string, requireD: false): CustomEventPointer | null;
export function parseCoordinate(a: string, requireD: true): AddressPointer | null;
export function parseCoordinate(a: string, requireD: false, silent: false): CustomEventPointer;
export function parseCoordinate(a: string, requireD: true, silent: false): AddressPointer;
export function parseCoordinate(a: string, requireD = false, silent = true): CustomEventPointer | null {
  const parts = a.split(":") as (string | undefined)[];
  const kind = parts[0] && parseInt(parts[0]);
  const pubkey = parts[1];
  const d = parts[2];

  if (!kind) {
    if (silent) return null;
    else throw new Error("Missing kind");
  }
  if (!pubkey) {
    if (silent) return null;
    else throw new Error("Missing pubkey");
  }
  if (requireD && !d) {
    if (silent) return null;
    else throw new Error("Missing identifier");
  }

  return {
    kind,
    pubkey,
    identifier: d,
  };
}

export function parseHardcodedNoteContent(event: NostrEvent) {
  const json = safeJson(event.content, null);
  if (!json) return null;

  // ensure the note has tags
  json.tags = json.tags || [];

  validateEvent(json);

  return (json as NostrEvent) ?? null;
}
