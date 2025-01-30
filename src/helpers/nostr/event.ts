import { EventTemplate, kinds } from "nostr-tools";
import { getEventUID } from "nostr-idb";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import { getNip10References } from "applesauce-core/helpers";

import { ATag, ETag, isDTag, NostrEvent, Tag } from "../../types/nostr-event";
import { getMatchNostrLink } from "../regexp";
import { AddressPointer, DecodeResult, EventPointer } from "nostr-tools/nip19";
import { safeDecode } from "../nip19";
import { truncateId } from "../string";
import { createATagFromAddressPointer, createETagFromEventPointer } from "applesauce-factory/helpers";

export { truncateId as truncatedId };

/** @deprecated use isReplaceableKind or isParameterizedReplaceableKind instead */
export function isReplaceable(kind: number) {
  return kinds.isReplaceableKind(kind) || kinds.isParameterizedReplaceableKind(kind);
}

export function pointerMatchEvent(event: NostrEvent, pointer: AddressPointer | EventPointer) {
  if (isReplaceable(event.kind)) {
    if (Reflect.has(pointer, "pubkey")) {
      const p = pointer as AddressPointer;
      const d = event.tags.find(isDTag)?.[1];
      return event.pubkey === p.pubkey && event.kind === p.kind && d === p.identifier;
    }
  } else {
    if (Reflect.has(pointer, "id")) {
      const p = pointer as EventPointer;
      return p.id === event.id;
    }
  }
  return false;
}

const isReplySymbol = Symbol("isReply");
export function isReply(event: NostrEvent | EventTemplate) {
  try {
    // @ts-expect-error
    if (event[isReplySymbol] !== undefined) return event[isReplySymbol] as boolean;

    if (event.kind === kinds.Repost || event.kind === kinds.GenericRepost) return false;
    const isReply = !!getNip10References(event).reply;
    // @ts-expect-error
    event[isReplySymbol] = isReply;
    return isReply;
  } catch (error) {
    return false;
  }
}
export function isPTagMentionedInContent(event: NostrEvent | EventTemplate, pubkey: string) {
  return filterTagsByContentRefs(event.content, event.tags).some((t) => t[1] === pubkey);
}

const isRepostSymbol = Symbol("isRepost");
export function isRepost(event: NostrEvent | EventTemplate) {
  // @ts-expect-error
  if (event[isRepostSymbol] !== undefined) return event[isRepostSymbol] as boolean;

  if (event.kind === kinds.Repost || event.kind === kinds.GenericRepost) return true;

  const match = event.content.match(getMatchNostrLink());
  const isRepost = !!match && match[0].length === event.content.length;

  // @ts-expect-error
  event[isRepostSymbol] = isRepost;
  return isRepost;
}

export function getContentPointers(content: string) {
  const pointers: DecodeResult[] = [];

  const linkMatches = Array.from(content.matchAll(getMatchNostrLink()));
  for (const [_, _prefix, link] of linkMatches) {
    const decoded = safeDecode(link);
    if (!decoded) continue;
    pointers.push(decoded);
  }

  return pointers;
}

/**
 * returns an array of tags that are referenced in the content
 * either with the legacy #[0] syntax or nostr:xxxxx links
 */
export function getContentTagRefs(content: string, tags: Tag[]) {
  const foundTags = new Set<Tag>();

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
export function filterTagsByContentRefs(content: string, tags: Tag[], referenced = true) {
  const contentTagRefs = getContentTagRefs(content, tags);
  return tags.filter((t) => contentTagRefs.includes(t) === referenced);
}

/** @deprecated */
export { getNip10References as getThreadReferences };

/** @deprecated */
export function getEventCoordinate(event: NostrEvent) {
  const d = event.tags.find(isDTag)?.[1];
  return d ? `${event.kind}:${event.pubkey}:${d}` : `${event.kind}:${event.pubkey}`;
}

/** @deprecated use createATagFromAddressPointer instead*/
export function addressPointerToATag(pointer: AddressPointer): ATag {
  return createATagFromAddressPointer(pointer) as ATag;
}

/** @deprecated use createETagFromEventPointer instead*/
export function eventPointerToETag(pointer: EventPointer): ETag {
  return createETagFromEventPointer(pointer) as ETag;
}

export type CustomAddressPointer = Omit<AddressPointer, "identifier"> & {
  identifier?: string;
};

export { parseCoordinate } from "applesauce-core/helpers/pointers";

export function sortByDate(a: NostrEvent, b: NostrEvent) {
  return b.created_at - a.created_at;
}

/** create a copy of the event with a new created_at  */
export function cloneEvent(kind: number, event?: EventTemplate | NostrEvent): EventTemplate {
  return {
    kind: event?.kind ?? kind,
    created_at: dayjs().unix(),
    content: event?.content ?? "",
    tags: event?.tags ? Array.from(event.tags) : [],
  };
}

/** ensure an event has a d tag */
export function ensureDTag(draft: EventTemplate, d: string = nanoid()) {
  if (!draft.tags.some(isDTag)) {
    draft.tags.push(["d", d]);
  }
}

/** either replaces the existing tag or adds a new one */
export function replaceOrAddSimpleTag(draft: EventTemplate, tagName: string, value: string) {
  if (draft.tags.some((t) => t[0] === tagName)) {
    draft.tags = draft.tags.map((t) => (t[0] === tagName ? [tagName, value] : t));
  } else {
    draft.tags.push([tagName, value]);
  }
}

function groupByKind(events: NostrEvent[]) {
  const byKind: Record<number, NostrEvent[]> = {};
  for (const event of events) {
    byKind[event.kind] = byKind[event.kind] || [];
    byKind[event.kind].push(event);
  }
  return byKind;
}

export function getSortedKinds(events: NostrEvent[]) {
  const byKind = groupByKind(events);

  return Object.entries(byKind)
    .map(([kind, events]) => ({ kind, count: events.length }))
    .sort((a, b) => b.count - a.count)
    .reduce((dir, k) => ({ ...dir, [k.kind]: k.count }), {} as Record<string, number>);
}

export function getTagValue(event: NostrEvent, tag: string) {
  return event.tags.find((t) => t[0] === tag && t.length >= 2)?.[1];
}

export { getEventUID };
