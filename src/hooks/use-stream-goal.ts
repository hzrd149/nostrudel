import { castEvent, Stream } from "applesauce-common/casts";
import { NostrEvent } from "nostr-tools";

import { eventStore } from "../services/event-store";
import useSingleEvent from "./use-single-event";

export default function useStreamGoal(stream: NostrEvent) {
  // Stream.goal$ looks the goal up by id only; goalPointer carries the stream's relays as hints
  return useSingleEvent(castEvent(stream, Stream, eventStore).goalPointer);
}
