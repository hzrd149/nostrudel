import { CastConstructor, EventCast } from "applesauce-common/casts";
import { castEventStream } from "applesauce-common/observable";
import { use$ } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";

import { eventStore } from "../services/event-store";

export default function useCastEvent<T extends EventCast<NostrEvent>>(
  event: NostrEvent | undefined,
  Cast: CastConstructor<T>,
) {
  return use$(() => {
    if (!event) return undefined;
    return eventStore.event(event).pipe(castEventStream(Cast, eventStore));
  }, [event?.id, Cast]);
}
