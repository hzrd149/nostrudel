import dayjs from "dayjs";
import { EventTemplate, NostrEvent, kinds, nip19 } from "nostr-tools";
import { getPointerFromTag } from "applesauce-core/helpers";

import { PTag, isATag, isDTag, isPTag, isRTag } from "../../types/nostr-event";
import { getEventCoordinate, replaceOrAddSimpleTag } from "./event";
import { getRelayVariations, safeRelayUrls } from "../relay";
import { isAddressPointerInList, isEventPointerInList, isProfilePointerInList } from "applesauce-lists/helpers";

export const LIST_KINDS = [
  kinds.Mutelist,
  kinds.Pinlist,
  kinds.RelayList,
  kinds.BookmarkList,
  kinds.CommunitiesList,
  kinds.PublicChatsList,
  kinds.BlockedRelaysList,
  kinds.SearchRelaysList,
  kinds.InterestsList,
  kinds.UserEmojiList,
  kinds.DirectMessageRelaysList,
];
export const SET_KINDS = [
  kinds.Followsets,
  kinds.Bookmarksets,
  kinds.Genericlists,
  kinds.Relaysets,
  kinds.Interestsets,
  kinds.Emojisets,
  kinds.Curationsets,
];

export function getListName(event: NostrEvent) {
  if (event.kind === kinds.Contacts) return "Following";
  if (event.kind === kinds.Mutelist) return "Mute";
  if (event.kind === kinds.Pinlist) return "Pins";
  if (event.kind === kinds.BookmarkList) return "Bookmarks";
  if (event.kind === kinds.CommunitiesList) return "Communities";
  if (event.kind === kinds.InterestsList) return "Interests";
  if (event.kind === kinds.PublicChatsList) return "Public Chats";

  return (
    event.tags.find((t) => t[0] === "title")?.[1] ||
    event.tags.find((t) => t[0] === "name")?.[1] ||
    event.tags.find(isDTag)?.[1]
  );
}
export function setListName(draft: EventTemplate, name: string) {
  replaceOrAddSimpleTag(draft, "name", name);
}
export function getListDescription(event: NostrEvent) {
  return event.tags.find((t) => t[0] === "description")?.[1];
}
export function setListDescription(draft: EventTemplate, description: string) {
  replaceOrAddSimpleTag(draft, "description", description);
}

export function isJunkList(event: NostrEvent) {
  const name = event.tags.find(isDTag)?.[1];
  if (!name) return false;
  if (event.kind !== kinds.Followsets) return false;
  return /^(chats\/([0-9a-f]{64}|null)|notifications)\/lastOpened$/.test(name);
}

/** Check if is kind is list */
export function isSpecialListKind(kind: number) {
  return kind === kinds.Contacts || LIST_KINDS.includes(kind);
}

export function cloneList(list: NostrEvent, keepCreatedAt = false): EventTemplate {
  return {
    kind: list.kind,
    content: list.content,
    tags: Array.from(list.tags),
    created_at: keepCreatedAt ? list.created_at : dayjs().unix(),
  };
}

export function getPubkeysFromList(event: NostrEvent | EventTemplate) {
  return event.tags.filter(isPTag).map((t) => ({ pubkey: t[1], relay: t[2], petname: t[3] }));
}
export function getReferencesFromList(event: NostrEvent | EventTemplate) {
  return event.tags.filter(isRTag).map((t) => ({ url: t[1], petname: t[2] }));
}
export function getRelaysFromList(event: NostrEvent | EventTemplate) {
  if (event.kind === kinds.RelayList) return safeRelayUrls(event.tags.filter(isRTag).map((t) => t[1]));
  else return safeRelayUrls(event.tags.filter((t) => t[0] === "relay" && t[1]).map((t) => t[1]) as string[]);
}

export function getPointersFromList(event: NostrEvent | EventTemplate) {
  return event.tags.map(getPointerFromTag).filter((r) => r !== null);
}

export function isRelayInList(list: NostrEvent, relay: string) {
  const relays = getRelaysFromList(list);
  return getRelayVariations(relay).some((r) => relays.includes(r));
}

/** @deprecated */
export function isPubkeyInList(list?: NostrEvent, pubkey?: string) {
  if (!pubkey || !list) return false;
  return isProfilePointerInList(list, pubkey);
}

export function isEventInList(list?: NostrEvent, event?: NostrEvent) {
  if (!event || !list) return false;

  if (kinds.isParameterizedReplaceableKind(event.kind)) {
    const cord = getEventCoordinate(event);
    return isAddressPointerInList(list, cord);
  } else return isEventPointerInList(list, event.id);
}

export function createEmptyContactList(): EventTemplate {
  return {
    created_at: dayjs().unix(),
    content: "",
    tags: [],
    kind: kinds.Contacts,
  };
}

/** @deprecated */
export function listAddPerson(
  list: NostrEvent | EventTemplate,
  pubkey: string,
  relay?: string,
  petname?: string,
): EventTemplate {
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

/** @deprecated */
export function listRemovePerson(list: NostrEvent | EventTemplate, pubkey: string): EventTemplate {
  return {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: list.tags.filter((t) => !(t[0] === "p" && t[1] === pubkey)),
  };
}

/** @deprecated */
export function listAddEvent(list: NostrEvent | EventTemplate, event: NostrEvent, relay?: string): EventTemplate {
  const tag = kinds.isParameterizedReplaceableKind(event.kind) ? ["a", getEventCoordinate(event)] : ["e", event.id];
  if (relay) tag.push(relay);

  if (list.tags.some((t) => t[0] === tag[0] && t[1] === tag[1])) throw new Error("Event already in list");

  return {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: [...list.tags, tag],
  };
}

/** @deprecated */
export function listRemoveEvent(list: NostrEvent | EventTemplate, event: NostrEvent): EventTemplate {
  const tag = kinds.isParameterizedReplaceableKind(event.kind) ? ["a", getEventCoordinate(event)] : ["e", event.id];

  return {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: list.tags.filter((t) => !(t[0] === tag[0] && t[1] === tag[1])),
  };
}

export function listAddRelay(list: NostrEvent | EventTemplate, relay: string): EventTemplate {
  if (list.tags.some((t) => t[0] === "e" && t[1] === relay)) throw new Error("Relay already in list");
  return {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: [...list.tags, ["relay", relay]],
  };
}

export function listRemoveRelay(list: NostrEvent | EventTemplate, relay: string): EventTemplate {
  return {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: list.tags.filter((t) => !(t[0] === "relay" && t[1] === relay)),
  };
}

/** @deprecated */
export function listAddCoordinate(list: NostrEvent | EventTemplate, coordinate: string, relay?: string): EventTemplate {
  if (list.tags.some((t) => t[0] === "a" && t[1] === coordinate)) throw new Error("Event already in list");

  return {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: [...list.tags, relay ? ["a", coordinate, relay] : ["a", coordinate]],
  };
}

/** @deprecated */
export function listRemoveCoordinate(list: NostrEvent | EventTemplate, coordinate: string): EventTemplate {
  return {
    created_at: dayjs().unix(),
    kind: list.kind,
    content: list.content,
    tags: list.tags.filter((t) => !(t[0] === "a" && t[1] === coordinate)),
  };
}
