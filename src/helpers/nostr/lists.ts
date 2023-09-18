import dayjs from "dayjs";
import { Kind } from "nostr-tools";
import { DraftNostrEvent, NostrEvent, isATag, isDTag, isETag, isPTag, isRTag } from "../../types/nostr-event";

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
export function getReferencesFromList(event: NostrEvent) {
  return event.tags.filter(isRTag).map((t) => ({ url: t[1], petname: t[2] }));
}
export function getCoordinatesFromList(event: NostrEvent) {
  return event.tags.filter(isATag).map((t) => ({ coordinate: t[1], relay: t[2] }));
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

export function draftAddPerson(list: NostrEvent | DraftNostrEvent, pubkey: string, relay?: string) {
  if (list.tags.some((t) => t[0] === "p" && t[1] === pubkey)) throw new Error("person already in list");

  const draft: DraftNostrEvent = {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: [...list.tags, relay ? ["p", pubkey, relay] : ["p", pubkey]],
  };

  return draft;
}

export function draftRemovePerson(list: NostrEvent | DraftNostrEvent, pubkey: string) {
  const draft: DraftNostrEvent = {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: list.tags.filter((t) => !(t[0] === "p" && t[1] === pubkey)),
  };

  return draft;
}

export function draftAddEvent(list: NostrEvent | DraftNostrEvent, event: string, relay?: string) {
  if (list.tags.some((t) => t[0] === "e" && t[1] === event)) throw new Error("event already in list");

  const draft: DraftNostrEvent = {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: [...list.tags, relay ? ["e", event, relay] : ["e", event]],
  };

  return draft;
}

export function draftRemoveEvent(list: NostrEvent | DraftNostrEvent, event: string) {
  const draft: DraftNostrEvent = {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: list.tags.filter((t) => !(t[0] === "e" && t[1] === event)),
  };

  return draft;
}
