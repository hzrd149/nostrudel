import { SUBSCRIBED_COMMUNITIES_LIST_IDENTIFIER } from "../helpers/nostr/communities";
import { getEventCoordinate } from "../helpers/nostr/events";
import { NOTE_LIST_KIND } from "../helpers/nostr/lists";
import { NostrEvent } from "../types/nostr-event";
import useEventCount from "./use-event-count";

export default function useCountCommunityMembers(community: NostrEvent) {
  return useEventCount({
    "#a": [getEventCoordinate(community)],
    "#d": [SUBSCRIBED_COMMUNITIES_LIST_IDENTIFIER],
    kinds: [NOTE_LIST_KIND],
  });
}
