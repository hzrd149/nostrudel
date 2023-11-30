import dayjs from "dayjs";
import { Kind, nip19 } from "nostr-tools";
import { AddressPointer } from "nostr-tools/lib/types/nip19";

import { DraftNostrEvent, NostrEvent, PTag, isATag, isDTag, isETag, isPTag, isRTag } from "../../types/nostr-event";
import { parseCoordinate } from "./events";

export const MUTE_LIST_KIND = 10000;
export const PIN_LIST_KIND = 10001;
export const BOOKMARK_LIST_KIND = 10003;
export const COMMUNITIES_LIST_KIND = 10004;
export const CHATS_LIST_KIND = 10005;

export const PEOPLE_LIST_KIND = 30000;
export const NOTE_LIST_KIND = 30001;
export const BOOKMARK_LIST_SET_KIND = 30003;

export function getListName(event: NostrEvent) {
  if (event.kind === Kind.Contacts) return "Following";
  if (event.kind === MUTE_LIST_KIND) return "Mute";
  if (event.kind === PIN_LIST_KIND) return "Pins";
  if (event.kind === BOOKMARK_LIST_KIND) return "Bookmarks";
  if (event.kind === COMMUNITIES_LIST_KIND) return "Communities";
  return (
    event.tags.find((t) => t[0] === "name")?.[1] ||
    event.tags.find((t) => t[0] === "title")?.[1] ||
    event.tags.find(isDTag)?.[1]
  );
}
export function getListDescription(event: NostrEvent) {
  return event.tags.find((t) => t[0] === "description")?.[1];
}

export function isJunkList(event: NostrEvent) {
  const name = event.tags.find(isDTag)?.[1];
  if (!name) return false;
  if (event.kind !== PEOPLE_LIST_KIND) return false;
  return /^(chats\/([0-9a-f]{64}|null)|notifications)\/lastOpened$/.test(name);
}
export function isSpecialListKind(kind: number) {
  return (
    kind === Kind.Contacts ||
    kind === MUTE_LIST_KIND ||
    kind === PIN_LIST_KIND ||
    kind === BOOKMARK_LIST_KIND ||
    kind === COMMUNITIES_LIST_KIND ||
    kind === CHATS_LIST_KIND
  );
}

export function cloneList(list: NostrEvent, keepCreatedAt = false): DraftNostrEvent {
  return {
    kind: list.kind,
    content: list.content,
    tags: Array.from(list.tags),
    created_at: keepCreatedAt ? list.created_at : dayjs().unix(),
  };
}

export function getPubkeysFromList(event: NostrEvent | DraftNostrEvent) {
  return event.tags.filter(isPTag).map((t) => ({ pubkey: t[1], relay: t[2], petname: t[3] }));
}
export function getEventsFromList(event: NostrEvent | DraftNostrEvent): nip19.EventPointer[] {
  return event.tags.filter(isETag).map((t) => (t[2] ? { id: t[1], relays: [t[2]] } : { id: t[1] }));
}
export function getReferencesFromList(event: NostrEvent | DraftNostrEvent) {
  return event.tags.filter(isRTag).map((t) => ({ url: t[1], petname: t[2] }));
}
export function getCoordinatesFromList(event: NostrEvent | DraftNostrEvent) {
  return event.tags.filter(isATag).map((t) => ({ coordinate: t[1], relay: t[2] }));
}
export function getParsedCordsFromList(event: NostrEvent | DraftNostrEvent) {
  const pointers: AddressPointer[] = [];

  for (const tag of event.tags) {
    if (!tag[1]) continue;
    const relay = tag[2];
    const parsed = parseCoordinate(tag[1]);
    if (!parsed?.identifier) continue;

    pointers.push({ ...parsed, identifier: parsed?.identifier, relays: relay ? [relay] : undefined });
  }

  return pointers;
}

export function isPubkeyInList(list?: NostrEvent, pubkey?: string) {
  if (!pubkey || !list) return false;
  return list.tags.some((t) => t[0] === "p" && t[1] === pubkey);
}

export function createEmptyContactList(): DraftNostrEvent {
  return {
    created_at: dayjs().unix(),
    content: "",
    tags: [],
    kind: Kind.Contacts,
  };
}

export function listAddPerson(
  list: NostrEvent | DraftNostrEvent,
  pubkey: string,
  relay?: string,
  petname?: string,
): DraftNostrEvent {
  if (list.tags.some((t) => t[0] === "p" && t[1] === pubkey)) throw new Error("person already in list");
  const pTag: PTag = ["p", pubkey, relay ?? "", petname ?? ""];
  while (pTag[pTag.length - 1] === "") pTag.pop();

  return {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: [...list.tags, pTag],
  };
}

export function listRemovePerson(list: NostrEvent | DraftNostrEvent, pubkey: string): DraftNostrEvent {
  return {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: list.tags.filter((t) => !(t[0] === "p" && t[1] === pubkey)),
  };
}

export function listAddEvent(list: NostrEvent | DraftNostrEvent, event: string, relay?: string): DraftNostrEvent {
  if (list.tags.some((t) => t[0] === "e" && t[1] === event)) throw new Error("event already in list");
  return {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: [...list.tags, relay ? ["e", event, relay] : ["e", event]],
  };
}

export function listRemoveEvent(list: NostrEvent | DraftNostrEvent, event: string): DraftNostrEvent {
  return {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: list.tags.filter((t) => !(t[0] === "e" && t[1] === event)),
  };
}

export function listAddCoordinate(
  list: NostrEvent | DraftNostrEvent,
  coordinate: string,
  relay?: string,
): DraftNostrEvent {
  if (list.tags.some((t) => t[0] === "a" && t[1] === coordinate)) throw new Error("coordinate already in list");
  return {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: [...list.tags, relay ? ["a", coordinate, relay] : ["a", coordinate]],
  };
}

export function listRemoveCoordinate(list: NostrEvent | DraftNostrEvent, coordinate: string): DraftNostrEvent {
  return {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: list.tags.filter((t) => !(t[0] === "a" && t[1] === coordinate)),
  };
}
