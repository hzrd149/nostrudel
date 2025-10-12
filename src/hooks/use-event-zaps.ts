import { isValidZap } from "applesauce-core/helpers";
import { useEventModel } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import EventZapsQuery from "../models/event-zaps";

export default function useEventZaps(event?: NostrEvent, relays?: string[]) {
  return useEventModel(EventZapsQuery, event ? [event, relays] : undefined)?.filter(isValidZap) ?? [];
}
