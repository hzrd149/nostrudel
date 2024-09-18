import { EventTemplate, kinds, validateEvent } from "nostr-tools";
import { getEventUID } from "nostr-idb";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

import { ATag, ETag, isDTag, isETag, isPTag, NostrEvent, Tag } from "../../types/nostr-event";
import { getMatchNostrLink } from "../regexp";
import { AddressPointer, DecodeResult, EventPointer } from "nostr-tools/nip19";
import { safeJson } from "../parse";
import { safeDecode } from "../nip19";
import { safeRelayUrl, safeRelayUrls } from "../relay";
import RelaySet from "../../classes/relay-set";
import { truncateId } from "../string";
import { getNip10References } from "./threading";

export { truncateId as truncatedId };

export function isReplaceable(kind: number) {
  return kinds.isReplaceableKind(kind) || kinds.isParameterizedReplaceableKind(kind);
}

export function pointerMatchEvent(event: NostrEvent, pointer: AddressPointer | EventPointer) {
  if (isReplaceable(event.kind)) {
    if (Object.hasOwn(pointer, "pubkey")) {
      const p = pointer as AddressPointer;
      const d = event.tags.find(isDTag)?.[1];
      return event.pubkey === p.pubkey && event.kind === p.kind && d === p.identifier;
    }
  } else {
    if (Object.hasOwn(pointer, "id")) {
      const p = pointer as EventPointer;
      return p.id === event.id;
    }
  }
  return false;
}

const isReplySymbol = Symbol("isReply");
export function isReply(event: NostrEvent | EventTemplate) {
  // @ts-expect-error
  if (event[isReplySymbol] !== undefined) return event[isReplySymbol] as boolean;

  if (event.kind === kinds.Repost || event.kind === kinds.GenericRepost) return false;
  const isReply = !!getNip10References(event).reply;
  // @ts-expect-error
  event[isReplySymbol] = isReply;
  return isReply;
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

    let matchingTags = tags.filter((t) => t[0] === type && t[1] === id);
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

export function eTagToEventPointer(tag: ETag): EventPointer {
  return { id: tag[1], relays: tag[2] ? safeRelayUrls([tag[2]]) : [] };
}
export function aTagToAddressPointer(tag: ATag): AddressPointer {
  const cord = parseCoordinate(tag[1], true, false);
  if (tag[2]) cord.relays = safeRelayUrls([tag[2]]);
  return cord;
}
export function addressPointerToATag(pointer: AddressPointer): ATag {
  const relay = pointer.relays?.[0];
  const coordinate = `${pointer.kind}:${pointer.pubkey}:${pointer.identifier}`;
  return relay ? ["a", coordinate, relay] : ["a", coordinate];
}
export function eventPointerToETag(pointer: EventPointer): ETag {
  return pointer.relays?.length ? ["e", pointer.id, pointer.relays[0]] : ["e", pointer.id];
}

export type CustomAddressPointer = Omit<AddressPointer, "identifier"> & {
  identifier?: string;
};

export function parseCoordinate(a: string): CustomAddressPointer | null;
export function parseCoordinate(a: string, requireD: false): CustomAddressPointer | null;
export function parseCoordinate(a: string, requireD: true): AddressPointer | null;
export function parseCoordinate(a: string, requireD: false, silent: false): CustomAddressPointer;
export function parseCoordinate(a: string, requireD: true, silent: false): AddressPointer;
export function parseCoordinate(a: string, requireD: true, silent: true): AddressPointer | null;
export function parseCoordinate(a: string, requireD: false, silent: true): CustomAddressPointer | null;
export function parseCoordinate(a: string, requireD = false, silent = true): CustomAddressPointer | null {
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
  if (requireD && d === undefined) {
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

export function getAllRelayHints(draft: NostrEvent | EventTemplate) {
  const hints = new RelaySet();
  for (const tag of draft.tags) {
    if ((isPTag(tag) || isETag(tag)) && tag[2]) {
      const url = safeRelayUrl(tag[2]);
      if (url) hints.add(url.toString());
    }
  }
  return hints;
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

export function getTagValue(event: NostrEvent, tag: string){
  return event.tags.find(t => t[0]===tag && t.length>=2)?.[1]
}

export { getEventUID };
