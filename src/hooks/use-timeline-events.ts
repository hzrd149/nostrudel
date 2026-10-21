import { use$ } from "applesauce-react/hooks";
import sum from "hash-sum";
import { Filter, NostrEvent } from "nostr-tools";
import { animationFrameScheduler, map, of, throttleTime } from "rxjs";

import { eventStore } from "../services/event-store";

const EMPTY: NostrEvent[] = [];

/**
 * Subscribes to the store timeline for filters, batching streamed events into one update per frame.
 * The first emission stays synchronous so changing filters never renders an empty list for a frame.
 */
export default function useTimelineEvents(
  filters: Filter | Filter[] | undefined,
  eventFilter?: (event: NostrEvent) => boolean,
): NostrEvent[] {
  return (
    use$(
      () =>
        filters
          ? eventStore.timeline(filters).pipe(
              throttleTime(0, animationFrameScheduler, { leading: true, trailing: true }),
              map((events) => (eventFilter ? events.filter(eventFilter) : events)),
            )
          : of(EMPTY),
      [sum(filters), eventFilter],
    ) ?? EMPTY
  );
}
