import { EventTemplate, kinds, validateEvent } from "nostr-tools";
import { getEventUID } from "nostr-idb";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

import { ATag, DraftNostrEvent, ETag, isATag, isDTag, isETag, isPTag, NostrEvent, Tag } from "../../types/nostr-event";
import { getMatchNostrLink } from "../regexp";
import { AddressPointer, EventPointer } from "nostr-tools/lib/types/nip19";
import { safeJson } from "../parse";
import { safeDecode } from "../nip19";
import { safeRelayUrl, safeRelayUrls } from "../relay";
import RelaySet from "../../classes/relay-set";
import { truncateId } from "../string";

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
export function isReply(event: NostrEvent | DraftNostrEvent) {
  // @ts-expect-error
  if (event[isReplySymbol] !== undefined) return event[isReplySymbol] as boolean;

  if (event.kind === kinds.Repost || event.kind === kinds.GenericRepost) return false;
  const isReply = !!getThreadReferences(event).reply;
  // @ts-expect-error
  event[isReplySymbol] = isReply;
  return isReply;
}
export function isPTagMentionedInContent(event: NostrEvent | DraftNostrEvent, pubkey: string) {
  return filterTagsByContentRefs(event.content, event.tags).some((t) => t[1] === pubkey);
}

const isRepostSymbol = Symbol("isRepost");
export function isRepost(event: NostrEvent | DraftNostrEvent) {
  // @ts-expect-error
  if (event[isRepostSymbol] !== undefined) return event[isRepostSymbol] as boolean;

  if (event.kind === kinds.Repost || event.kind === kinds.GenericRepost) return true;

  const match = event.content.match(getMatchNostrLink());
  const isRepost = !!match && match[0].length === event.content.length;

  // @ts-expect-error
  event[isRepostSymbol] = isRepost;
  return isRepost;
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

export function interpretThreadTags(event: NostrEvent | DraftNostrEvent) {
  const eTags = event.tags.filter(isETag);
  const aTags = event.tags.filter(isATag);

  // find the root and reply tags.
  let rootETag = eTags.find((t) => t[3] === "root");
  let replyETag = eTags.find((t) => t[3] === "reply");

  let rootATag = aTags.find((t) => t[3] === "root");
  let replyATag = aTags.find((t) => t[3] === "reply");

  if (!rootETag || !replyETag) {
    // a direct reply does not need a "reply" reference
    // https://github.com/nostr-protocol/nips/blob/master/10.md

    // this is not necessarily to spec. but if there is only one id (root or reply) then assign it to both
    // this handles the cases where a client only set a "reply" tag and no root
    rootETag = replyETag = rootETag || replyETag;
  }
  if (!rootATag || !replyATag) {
    rootATag = replyATag = rootATag || replyATag;
  }

  if (!rootETag && !replyETag) {
    const contentTagRefs = getContentTagRefs(event.content, eTags);

    // legacy behavior
    // https://github.com/nostr-protocol/nips/blob/master/10.md#positional-e-tags-deprecated
    const legacyETags = eTags.filter((t) => {
      // ignore it if there is a type
      if (t[3]) return false;
      if (contentTagRefs.includes(t)) return false;
      return true;
    });

    if (legacyETags.length >= 1) {
      // first tag is the root
      rootETag = legacyETags[0];
      // last tag is reply
      replyETag = legacyETags[legacyETags.length - 1] ?? rootETag;
    }
  }

  return {
    root: rootETag || rootATag ? { e: rootETag, a: rootATag } : undefined,
    reply: replyETag || replyATag ? { e: replyETag, a: replyATag } : undefined,
  } as {
    root?: { e: ETag; a: undefined } | { e: undefined; a: ATag } | { e: ETag; a: ATag };
    reply?: { e: ETag; a: undefined } | { e: undefined; a: ATag } | { e: ETag; a: ATag };
  };
}

export type ThreadReferences = {
  root?:
    | { e: EventPointer; a: undefined }
    | { e: undefined; a: AddressPointer }
    | { e: EventPointer; a: AddressPointer };
  reply?:
    | { e: EventPointer; a: undefined }
    | { e: undefined; a: AddressPointer }
    | { e: EventPointer; a: AddressPointer };
};
export const threadRefsSymbol = Symbol("threadRefs");
export type EventWithThread = (NostrEvent | DraftNostrEvent) & { [threadRefsSymbol]: ThreadReferences };

export function getThreadReferences(event: NostrEvent | DraftNostrEvent): ThreadReferences {
  // @ts-expect-error
  if (Object.hasOwn(event, threadRefsSymbol)) return event[threadRefsSymbol];

  const e = event as EventWithThread;
  const tags = interpretThreadTags(e);

  const threadRef = {
    root: tags.root && {
      e: tags.root.e && eTagToEventPointer(tags.root.e),
      a: tags.root.a && aTagToAddressPointer(tags.root.a),
    },
    reply: tags.reply && {
      e: tags.reply.e && eTagToEventPointer(tags.reply.e),
      a: tags.reply.a && aTagToAddressPointer(tags.reply.a),
    },
  } as ThreadReferences;

  // @ts-expect-error
  event[threadRefsSymbol] = threadRef;

  return threadRef;
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
export function cloneEvent(kind: number, event?: DraftNostrEvent | NostrEvent): DraftNostrEvent {
  return {
    kind: event?.kind ?? kind,
    created_at: dayjs().unix(),
    content: event?.content ?? "",
    tags: event?.tags ? Array.from(event.tags) : [],
  };
}

/** ensure an event has a d tag */
export function ensureDTag(draft: DraftNostrEvent, d: string = nanoid()) {
  if (!draft.tags.some(isDTag)) {
    draft.tags.push(["d", d]);
  }
}

export function replaceOrAddSimpleTag(draft: DraftNostrEvent, tagName: string, value: string) {
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

export { getEventUID };
