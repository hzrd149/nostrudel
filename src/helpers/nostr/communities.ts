import { isATag, parseCoordinate } from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";

/** @deprecated remove when communities are no longer supported */
export function getEventCommunityPointer(event: NostrEvent) {
  const communityTag = event.tags.filter(isATag).find((t) => t[1].startsWith(kinds.CommunityDefinition + ":"));
  return communityTag ? parseCoordinate(communityTag[1], true) : null;
}
