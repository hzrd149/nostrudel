import { NostrEvent, isATag } from "../../types/nostr-event";

export const EMOJI_PACK_KIND = 30030;
export const USER_EMOJI_LIST_KIND = 10030;

export function getPackName(event: NostrEvent) {
  return event.tags.find((t) => t[0] === "d")?.[1];
}

export function getEmojisFromPack(pack: NostrEvent) {
  return pack.tags
    .filter((t) => t[0] === "emoji" && t[1] && t[2])
    .map((t) => ({ name: t[1] as string, url: t[2] as string }));
}

export function getPackCordsFromFavorites(event: NostrEvent) {
  return event.tags.filter(isATag).map((t) => t[1]);
}
