import { getOrComputeCachedValue, isDTag } from "applesauce-core/helpers";
import { getNip10References } from "applesauce-common/helpers";
import { EventTemplate, kinds, NostrEvent } from "nostr-tools";
import { AddressPointer } from "nostr-tools/nip19";

import { safeDecode } from "../nip19";
import { getMatchNostrLink } from "../regexp";

const isReplySymbol = Symbol("isReply");
export function isReply(event: NostrEvent | EventTemplate) {
  return getOrComputeCachedValue(event, isReplySymbol, () => {
    try {
      if (event.kind === kinds.Repost || event.kind === kinds.GenericRepost) return false;
      return !!getNip10References(event).reply;
    } catch {
      return false;
    }
  });
}

/** @deprecated test event kind instead */
export function isRepost(event: NostrEvent | EventTemplate) {
  return event.kind === kinds.Repost || event.kind === kinds.GenericRepost;
}

/**
 * returns an array of tags that are referenced in the content
 * either with the legacy #[0] syntax or nostr:xxxxx links
 */
export function getContentTagRefs(content: string, tags: string[][]) {
  const foundTags = new Set<string[]>();

  const linkMatches = Array.from(content.matchAll(getMatchNostrLink()));
  for (const [_, _prefix, link] of linkMatches) {
    const decoded = safeDecode(link);
    if (!decoded) continue;

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

    const matchingTags = tags.filter((t) => t[0] === type && t[1] === id);
    for (const t of matchingTags) foundTags.add(t);
  }

  return Array.from(foundTags);
}

/** returns all tags that are referenced in the content */
export function filterTagsByContentRefs(content: string, tags: string[][], referenced = true) {
  const contentTagRefs = getContentTagRefs(content, tags);
  return tags.filter((t) => contentTagRefs.includes(t) === referenced);
}

/** @deprecated */
export function getEventCoordinate(event: NostrEvent) {
  const d = event.tags.find(isDTag)?.[1];
  return d ? `${event.kind}:${event.pubkey}:${d}` : `${event.kind}:${event.pubkey}`;
}

export type CustomAddressPointer = Omit<AddressPointer, "identifier"> & {
  identifier?: string;
};

export function sortByDate<T extends { created_at: number }>(a: T, b: T) {
  return b.created_at - a.created_at;
}

/**
 * either replaces the existing tag or adds a new one
 * @deprecated use EventFactory operations with includeNameValueTag
 */
export function replaceOrAddSimpleTag(draft: EventTemplate, tagName: string, value: string) {
  if (draft.tags.some((t) => t[0] === tagName)) {
    draft.tags = draft.tags.map((t) => (t[0] === tagName ? [tagName, value] : t));
  } else {
    draft.tags.push([tagName, value]);
  }
}
