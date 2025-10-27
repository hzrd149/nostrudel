import { useEventModel } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";

import { ReactionsQuery } from "../models/reactions";

export default function useEventReactions(event?: NostrEvent, relays?: string[]) {
  return useEventModel(ReactionsQuery, event ? [event, relays] : undefined);
}
