import { NostrEvent } from "nostr-tools";

import useSingleEvent from "./use-single-event";
import { getStreamGoalPointer, getStreamRelays } from "../helpers/nostr/stream";

export default function useStreamGoal(stream: NostrEvent) {
  const relays = getStreamRelays(stream);
  return useSingleEvent(getStreamGoalPointer(stream), relays);
}
