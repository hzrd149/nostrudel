import { getNip10References, getOrComputeCachedValue, isDTag, isReplaceable } from "applesauce-core/helpers";
import dayjs from "dayjs";
import { getEventUID } from "nostr-idb";
import { EventTemplate, kinds, NostrEvent } from "nostr-tools";
import { AddressPointer, EventPointer } from "nostr-tools/nip19";

import { safeDecode } from "../nip19";
import { getMatchNostrLink } from "../regexp";
import { truncateId } from "../string";

export { truncateId as truncatedId };

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
  return getOrComputeCachedValue(event, isReplySymbol, () => {
    try {
      if (event.kind === kinds.Repost || event.kind === kinds.GenericRepost) return false;
      return !!getNip10References(event).reply;
    } catch (error) {
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

/** @deprecated use getNip10References instead */
export { getNip10References as getThreadReferences };

/** @deprecated */
export function getEventCoordinate(event: NostrEvent) {
  const d = event.tags.find(isDTag)?.[1];
  return d ? `${event.kind}:${event.pubkey}:${d}` : `${event.kind}:${event.pubkey}`;
}

export type CustomAddressPointer = Omit<AddressPointer, "identifier"> & {
  identifier?: string;
};

export { parseCoordinate } from "applesauce-core/helpers/pointers";

export function sortByDate<T extends { created_at: number }>(a: T, b: T) {
  return b.created_at - a.created_at;
}

/**
 * create a copy of the event with a new created_at
 * @deprecated use factory.modify instead */
export function cloneEvent(kind: number, event?: EventTemplate | NostrEvent): EventTemplate {
  return {
    kind: event?.kind ?? kind,
    created_at: dayjs().unix(),
    content: event?.content ?? "",
    tags: event?.tags ? Array.from(event.tags) : [],
  };
}

/**
 * either replaces the existing tag or adds a new one
 * @deprecated use factory.modifyTags with includeNameValueTag
 */
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

export { getEventUID };
