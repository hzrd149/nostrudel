import dayjs from "dayjs";
import { DraftNostrEvent, NostrEvent, isDTag, isPTag } from "../../types/nostr-event";
import { Kind } from "nostr-tools";

export const PEOPLE_LIST = 30000;
export const NOTE_LIST = 30001;
export const MUTE_LIST = 10000;
export const FOLLOW_LIST = Kind.Contacts;

export function getListName(event: NostrEvent) {
  if (event.kind === 3) return "Following";
  return event.tags.find(isDTag)?.[1];
}

export function getPubkeysFromList(event: NostrEvent) {
  return event.tags.filter(isPTag).map((t) => ({ pubkey: t[1], relay: t[2] }));
}

export function draftAddPerson(event: NostrEvent, pubkey: string, relay?: string) {
  if (event.tags.some((t) => t[0] === "p" && t[1] === pubkey)) throw new Error("person already in list");

  const draft: DraftNostrEvent = {
    created_at: dayjs().unix(),
    kind: event.kind,
    content: event.content,
    tags: [...event.tags, relay ? ["p", pubkey, relay] : ["p", pubkey]],
  };

  return draft;
}

export function draftRemovePerson(event: NostrEvent, pubkey: string) {
  const draft: DraftNostrEvent = {
    created_at: dayjs().unix(),
    kind: event.kind,
    content: event.content,
    tags: event.tags.filter((t) => t[0] !== "p" || t[1] !== pubkey),
  };

  return draft;
}
