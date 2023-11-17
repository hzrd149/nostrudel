import { getEventCoordinate } from "../helpers/nostr/events";
import { COMMUNITIES_LIST_KIND } from "../helpers/nostr/lists";
import { NostrEvent } from "../types/nostr-event";
import useEventCount from "./use-event-count";

export default function useCountCommunityMembers(community: NostrEvent) {
  return useEventCount({ "#a": [getEventCoordinate(community)], kinds: [COMMUNITIES_LIST_KIND] });
}
