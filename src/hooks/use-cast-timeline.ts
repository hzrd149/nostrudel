import { castEvent, CastConstructor, EventCast } from "applesauce-common/casts";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import { eventStore } from "../services/event-store";

/**
 * Casts an array of events to typed cast instances.
 * Casts are cached per-event by `castEvent`, so this is safe to call on every render.
 */
export default function useCastTimeline<T extends EventCast<NostrEvent>>(
  events: NostrEvent[] | undefined,
  Cast: CastConstructor<T>,
): T[] {
  return useMemo(
    () =>
      (events ?? []).map((event) => {
        // T is signed-event-only; TypeScript cannot reduce v7's conditional input type for generic T.
        return castEvent(event as Parameters<typeof castEvent<T>>[0], Cast, eventStore);
      }),
    [events, Cast],
  );
}
