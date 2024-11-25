import { kinds } from "nostr-tools";

import { getEventCoordinate } from "../helpers/nostr/event";
import { NostrEvent } from "../types/nostr-event";
import useEventCount from "./use-event-count";

export default function useCountCommunityMembers(community: NostrEvent) {
  return useEventCount({ "#a": [getEventCoordinate(community)], kinds: [kinds.CommunitiesList] });
}
