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

export function getPostSubject(event: NostrEvent) {
  const subject = event.tags.find((t) => t[0] === "subject")?.[1];
  if (subject) return subject;
  const firstLine = event.content.match(/^[^\n\t]+/)?.[0];
  if (!firstLine) return;
  if (!getMatchNostrLink().test(firstLine) && !getMatchLink().test(firstLine)) return firstLine;
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

export function buildApprovalMap(events: Iterable<NostrEvent>, mods: string[]) {
  const approvals = new Map<string, NostrEvent[]>();
  for (const event of events) {
    if (event.kind === kinds.CommunityPostApproval && mods.includes(event.pubkey)) {
      for (const tag of event.tags) {
        if (isETag(tag)) {
          const arr = approvals.get(tag[1]);
          if (!arr) approvals.set(tag[1], [event]);
          else arr.push(event);
        }
      }
    }
  }
  return approvals;
}

export function getEventCommunityPointer(event: NostrEvent) {
  const communityTag = event.tags.filter(isATag).find((t) => t[1].startsWith(kinds.CommunityDefinition + ":"));
  return communityTag ? parseCoordinate(communityTag[1], true) : null;
}
