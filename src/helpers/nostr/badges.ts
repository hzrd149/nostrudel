import { getProfilePointerFromPTag, isPTag } from "applesauce-core/helpers";
import { ATag, NostrEvent, isATag, isETag } from "../../types/nostr-event";

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

export function getBadgeAwardPubkeys(event: NostrEvent) {
  return event.tags.filter(isPTag).map(getProfilePointerFromPTag);
}
export function getBadgeAwardBadge(event: NostrEvent) {
  const badgeCord = event.tags.find(isATag)?.[1];
  if (!badgeCord) throw new Error("Missing badge reference");
  return badgeCord;
}

export function parseProfileBadges(profileBadges: NostrEvent) {
  const badgesAdded = new Set();
  const badgeAwardSets: { badgeCord: string; awardEventId: string; relay?: string }[] = [];

  let lastBadgeTag: ATag | undefined;
  for (const tag of profileBadges.tags) {
    if (isATag(tag)) {
      lastBadgeTag = tag;
    } else if (isETag(tag) && lastBadgeTag && !badgesAdded.has(lastBadgeTag[1])) {
      badgeAwardSets.push({ badgeCord: lastBadgeTag[1], awardEventId: tag[1], relay: tag[2] });
      badgesAdded.add(lastBadgeTag[1]);
      lastBadgeTag = undefined;
    }
  }

  return badgeAwardSets;
}
