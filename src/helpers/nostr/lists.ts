import dayjs from "dayjs";
import { DraftNostrEvent, NostrEvent, isDTag, isPTag } from "../../types/nostr-event";
import { Kind } from "nostr-tools";

export const PEOPLE_LIST_KIND = 30000;
export const NOTE_LIST_KIND = 30001;
export const MUTE_LIST_KIND = 10000;

export function getListName(event: NostrEvent) {
  if (event.kind === 3) return "Following";
  return event.tags.find(isDTag)?.[1];
}

export function getPubkeysFromList(event: NostrEvent) {
  return event.tags.filter(isPTag).map((t) => ({ pubkey: t[1], relay: t[2] }));
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

export function draftAddPerson(event: NostrEvent | DraftNostrEvent, pubkey: string, relay?: string) {
  if (event.tags.some((t) => t[0] === "p" && t[1] === pubkey)) throw new Error("person already in list");

  const draft: DraftNostrEvent = {
    created_at: dayjs().unix(),
    kind: event.kind,
    content: event.content,
    tags: [...event.tags, relay ? ["p", pubkey, relay] : ["p", pubkey]],
  };

  return draft;
}

export function draftRemovePerson(event: NostrEvent | DraftNostrEvent, pubkey: string) {
  const draft: DraftNostrEvent = {
    created_at: dayjs().unix(),
    kind: event.kind,
    content: event.content,
    tags: event.tags.filter((t) => t[0] !== "p" || t[1] !== pubkey),
  };

  return draft;
}
