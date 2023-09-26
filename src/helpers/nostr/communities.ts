import { validateEvent } from "nostr-tools";
import { NostrEvent, isDTag, isPTag } from "../../types/nostr-event";

export const SUBSCRIBED_COMMUNITIES_LIST_IDENTIFIER = "communities";
export const COMMUNITY_DEFINITION_KIND = 34550;
export const COMMUNITY_APPROVAL_KIND = 4550;

export function getCommunityName(community: NostrEvent) {
  const name = community.tags.find(isDTag)?.[1];
  if (!name) throw new Error("Missing name");
  return name;
}

export function getCommunityMods(community: NostrEvent) {
  const mods = community.tags.filter((t) => isPTag(t) && t[1] && t[3] === "moderator").map((t) => t[1]) as string[];
  return mods;
}
export function getCOmmunityRelays(community: NostrEvent) {
  return community.tags.filter((t) => t[0] === "relay" && t[1]).map((t) => t[1]) as string[];
}

export function getCommunityImage(community: NostrEvent) {
  return community.tags.find((t) => t[0] === "image")?.[1];
}
export function getCommunityDescription(community: NostrEvent) {
  return community.tags.find((t) => t[0] === "description")?.[1];
}

export function getApprovedEmbeddedNote(approval: NostrEvent) {
  if (!approval.content) return null;
  try {
    const json = JSON.parse(approval.content);
    validateEvent(json);
    return (json as NostrEvent) ?? null;
  } catch (e) {}
  return null;
}

export function validateCommunity(community: NostrEvent) {
  try {
    getCommunityName(community);
    return true;
  } catch (e) {
    return false;
  }
}
