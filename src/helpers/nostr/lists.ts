import dayjs from "dayjs";
import { kinds, nip19 } from "nostr-tools";

import { DraftNostrEvent, NostrEvent, PTag, isATag, isDTag, isETag, isPTag, isRTag } from "../../types/nostr-event";
import { parseCoordinate, replaceOrAddSimpleTag } from "./event";
import { getRelayVariations, safeRelayUrls } from "../relay";

export const MUTE_LIST_KIND = kinds.Mutelist;
export const PIN_LIST_KIND = kinds.Pinlist;
export const BOOKMARK_LIST_KIND = kinds.BookmarkList;
export const COMMUNITIES_LIST_KIND = kinds.CommunitiesList;
export const CHANNELS_LIST_KIND = kinds.PublicChatsList;

export const PEOPLE_LIST_KIND = kinds.Followsets;
export const NOTE_LIST_KIND = 30001;
export const BOOKMARK_LIST_SET_KIND = kinds.Bookmarksets;

export function getListName(event: NostrEvent) {
  if (event.kind === kinds.Contacts) return "Following";
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
export function setListName(draft: DraftNostrEvent, name: string) {
  replaceOrAddSimpleTag(draft, "name", name);
}
export function getListDescription(event: NostrEvent) {
  return event.tags.find((t) => t[0] === "description")?.[1];
}
export function setListDescription(draft: DraftNostrEvent, description: string) {
  replaceOrAddSimpleTag(draft, "description", description);
}

export function isJunkList(event: NostrEvent) {
  const name = event.tags.find(isDTag)?.[1];
  if (!name) return false;
  if (event.kind !== PEOPLE_LIST_KIND) return false;
  return /^(chats\/([0-9a-f]{64}|null)|notifications)\/lastOpened$/.test(name);
}
export function isSpecialListKind(kind: number) {
  return (
    kind === kinds.Contacts ||
    kind === MUTE_LIST_KIND ||
    kind === PIN_LIST_KIND ||
    kind === BOOKMARK_LIST_KIND ||
    kind === COMMUNITIES_LIST_KIND ||
    kind === CHANNELS_LIST_KIND
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
export function getEventPointersFromList(event: NostrEvent | DraftNostrEvent): nip19.EventPointer[] {
  return event.tags.filter(isETag).map((t) => (t[2] ? { id: t[1], relays: [t[2]] } : { id: t[1] }));
}
export function getReferencesFromList(event: NostrEvent | DraftNostrEvent) {
  return event.tags.filter(isRTag).map((t) => ({ url: t[1], petname: t[2] }));
}
export function getRelaysFromList(event: NostrEvent | DraftNostrEvent) {
  if (event.kind === kinds.RelayList) return safeRelayUrls(event.tags.filter(isRTag).map((t) => t[1]));
  else return safeRelayUrls(event.tags.filter((t) => t[0] === "relay" && t[1]).map((t) => t[1]) as string[]);
}
export function getCoordinatesFromList(event: NostrEvent | DraftNostrEvent) {
  return event.tags.filter(isATag).map((t) => ({ coordinate: t[1], relay: t[2] }));
}
export function getAddressPointersFromList(event: NostrEvent | DraftNostrEvent): nip19.AddressPointer[] {
  const pointers: nip19.AddressPointer[] = [];

  for (const tag of event.tags) {
    if (!tag[1]) continue;
    const relay = tag[2];
    const parsed = parseCoordinate(tag[1]);
    if (!parsed?.identifier) continue;

    pointers.push({ ...parsed, identifier: parsed?.identifier, relays: relay ? [relay] : undefined });
  }

  return pointers;
}

export function isRelayInList(list: NostrEvent, relay: string) {
  const relays = getRelaysFromList(list);
  return getRelayVariations(relay).some((r) => relays.includes(r));
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
    kind: kinds.Contacts,
  };
}

export function listAddPerson(
  list: NostrEvent | DraftNostrEvent,
  pubkey: string,
  relay?: string,
  petname?: string,
): DraftNostrEvent {
  if (list.tags.some((t) => t[0] === "p" && t[1] === pubkey)) throw new Error("Person already in list");
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
  if (list.tags.some((t) => t[0] === "e" && t[1] === event)) throw new Error("Event already in list");
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

export function listAddRelay(list: NostrEvent | DraftNostrEvent, relay: string): DraftNostrEvent {
  if (list.tags.some((t) => t[0] === "e" && t[1] === relay)) throw new Error("Relay already in list");
  return {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: [...list.tags, ["relay", relay]],
  };
}

export function listRemoveRelay(list: NostrEvent | DraftNostrEvent, relay: string): DraftNostrEvent {
  return {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: list.tags.filter((t) => !(t[0] === "relay" && t[1] === relay)),
  };
}

export function listAddCoordinate(
  list: NostrEvent | DraftNostrEvent,
  coordinate: string,
  relay?: string,
): DraftNostrEvent {
  if (list.tags.some((t) => t[0] === "a" && t[1] === coordinate)) throw new Error("Event already in list");

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
