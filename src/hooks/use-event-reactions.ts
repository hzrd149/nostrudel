import { NostrEvent } from "nostr-tools";

import { useEventModel } from "applesauce-react/hooks";
import { ReactionsQuery } from "../models/reactions";

export default function useEventReactions(event: NostrEvent, relays?: string[]) {
  return useEventModel(ReactionsQuery, [event, relays]);
}
