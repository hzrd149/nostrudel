import { NostrEvent, isATag, isPTag } from "../../types/nostr-event";
import { getPubkeysFromList } from "./lists";

export const PROFILE_BADGES_IDENTIFIER = "profile_badges";

export function getBadgeName(event: NostrEvent) {
  return event.tags.find((t) => t[0] === "name")?.[1];
}
export function getBadgeDescription(event: NostrEvent) {
  return event.tags.find((t) => t[0] === "description")?.[1];
}
export function getBadgeImage(event: NostrEvent) {
  const tag = event.tags.find((t) => t[0] === "image");
  if (!tag) return;
  return {
    src: tag[1] as string,
    size: tag[2],
  };
}
export function getBadgeThumbnails(event: NostrEvent) {
  return event.tags
    .filter((t) => t[0] === "thumb")
    .map(
      (tag) =>
        tag && {
          src: tag[1],
          size: tag[2],
        },
    )
    .filter(Boolean);
}

export function getBadgeAwardPubkey(event: NostrEvent) {
  return getPubkeysFromList(event);
}
export function getBadgeAwardBadge(event: NostrEvent) {
  const badgeCord = event.tags.find(isATag)?.[1];
  if (!badgeCord) throw new Error("Missing badge reference");
  return badgeCord;
}
export function validateBadgeAwardEvent(event: NostrEvent) {
  getBadgeAwardPubkey(event);
  getBadgeAwardBadge(event);
  return true;
}
