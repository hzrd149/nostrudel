import { kinds, validateEvent } from "nostr-tools";
import { NostrEvent, isATag, isDTag, isETag, isPTag } from "../../types/nostr-event";
import { getMatchLink, getMatchNostrLink } from "../regexp";
import { parseCoordinate } from "./event";

/** @deprecated */
export const SUBSCRIBED_COMMUNITIES_LIST_IDENTIFIER = "communities";

export function getCommunityName(community: NostrEvent) {
  const name = community.tags.find(isDTag)?.[1];
  if (!name) throw new Error("Missing name");
  return name;
}

export function getCommunityMods(community: NostrEvent) {
  const mods = community.tags.filter((t) => isPTag(t) && t[1] && t[3] === "moderator").map((t) => t[1]) as string[];
  return mods;
}
export function getCommunityRelays(community: NostrEvent) {
  return community.tags.filter((t) => t[0] === "relay" && t[1]).map((t) => t[1]) as string[];
}
export function getCommunityLinks(community: NostrEvent) {
  return community.tags.filter((t) => t[0] === "r" && t[1]).map((t) => (t[2] ? [t[1], t[2]] : [t[1]])) as (
    | [string]
    | [string, string]
  )[];
}

export function getCommunityImage(community: NostrEvent) {
  return community.tags.find((t) => t[0] === "image")?.[1];
}
export function getCommunityDescription(community: NostrEvent) {
  return community.tags.find((t) => t[0] === "description")?.[1];
}
export function getCommunityRules(community: NostrEvent) {
  return community.tags.find((t) => t[0] === "rules")?.[1];
}
export function getCommunityRanking(community: NostrEvent) {
  return community.tags.find((t) => t[0] === "rank_mode")?.[1];
}

export function getEventCommunityPointer(event: NostrEvent) {
  const communityTag = event.tags.filter(isATag).find((t) => t[1].startsWith(kinds.CommunityDefinition + ":"));
  return communityTag ? parseCoordinate(communityTag[1], true) : null;
}
