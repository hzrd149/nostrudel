import { castEvent, Stream } from "applesauce-common/casts";
import { use$ } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";

import { eventStore } from "../services/event-store";

export default function useStreamGoal(stream: NostrEvent) {
  return use$(castEvent(stream, Stream, eventStore).goal$);
}
