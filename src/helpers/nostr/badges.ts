import {
  getAddressPointerFromATag,
  getEventPointerFromETag,
  getOrComputeCachedValue,
  getProfilePointerFromPTag,
  isATag,
  isETag,
  isPTag,
} from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { AddressPointer, EventPointer } from "nostr-tools/nip19";

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

export const ProfileBadgesSymbol = Symbol("profile-badges");

export type ProfileBadge = {
  badge: AddressPointer;
  award: EventPointer;
};

export function getProfileBadges(profileBadges: NostrEvent): ProfileBadge[] {
  return getOrComputeCachedValue(profileBadges, ProfileBadgesSymbol, () => {
    const seen = new Set();
    const badges: ProfileBadge[] = [];

    let lastAtag: ["a", ...string[]] | undefined;
    for (const tag of profileBadges.tags) {
      if (isATag(tag)) {
        lastAtag = tag;
      } else if (isETag(tag) && lastAtag && !seen.has(lastAtag[1])) {
        badges.push({ badge: getAddressPointerFromATag(lastAtag), award: getEventPointerFromETag(tag) });
        seen.add(lastAtag[1]);
        lastAtag = undefined;
      }
    }

    return badges;
  });
}
