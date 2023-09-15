import dayjs from "dayjs";
import { Kind, nip19 } from "nostr-tools";
import { AddressPointer } from "nostr-tools/lib/nip19";

import { DraftNostrEvent, NostrEvent, isATag, isDTag, isETag, isPTag } from "../../types/nostr-event";
import { parseCoordinate } from "./events";

export const PEOPLE_LIST_KIND = 30000;
export const NOTE_LIST_KIND = 30001;
export const PIN_LIST_KIND = 10001;
export const MUTE_LIST_KIND = 10000;

export function getListName(event: NostrEvent) {
  if (event.kind === Kind.Contacts) return "Following";
  if (event.kind === PIN_LIST_KIND) return "Pins";
  if (event.kind === MUTE_LIST_KIND) return "Mute";
  return (
    event.tags.find((t) => t[0] === "name")?.[1] ||
    event.tags.find((t) => t[0] === "title")?.[1] ||
    event.tags.find(isDTag)?.[1]
  );
}

export function isSpecialListKind(kind: number) {
  return kind === Kind.Contacts || kind === PIN_LIST_KIND || kind === MUTE_LIST_KIND;
}

export function getPubkeysFromList(event: NostrEvent) {
  return event.tags.filter(isPTag).map((t) => ({ pubkey: t[1], relay: t[2] }));
}
export function getEventsFromList(event: NostrEvent) {
  return event.tags.filter(isETag).map((t) => ({ id: t[1], relay: t[2] }));
}
export function getCoordinatesFromList(event: NostrEvent) {
  return event.tags.filter(isATag).map((t) => ({ coordinate: t[1], relay: t[2] }));
}
export function getParsedCordsFromList(event: NostrEvent) {
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

export function isPubkeyInList(event?: NostrEvent, pubkey?: string) {
  if (!pubkey || !event) return false;
  return event.tags.some((t) => t[0] === "p" && t[1] === pubkey);
}

export function createEmptyContactList(): DraftNostrEvent {
  return {
    created_at: dayjs().unix(),
    content: "",
    tags: [],
    kind: Kind.Contacts,
  };
}
export function createEmptyMuteList(): DraftNostrEvent {
  return {
    created_at: dayjs().unix(),
    content: "",
    tags: [],
    kind: MUTE_LIST_KIND,
  };
}

export function listAddPerson(list: NostrEvent | DraftNostrEvent, pubkey: string, relay?: string): DraftNostrEvent {
  if (list.tags.some((t) => t[0] === "p" && t[1] === pubkey)) throw new Error("person already in list");
  return {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: [...list.tags, relay ? ["p", pubkey, relay] : ["p", pubkey]],
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
