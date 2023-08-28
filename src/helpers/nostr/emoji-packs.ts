import { NostrEvent } from "../../types/nostr-event";

export function getEmojisFromPack(pack: NostrEvent) {
  return pack.tags
    .filter((t) => t[0] === "emoji" && t[1] && t[2])
    .map((t) => ({ name: t[1] as string, url: t[2] as string }));
}
