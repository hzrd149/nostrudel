import { useInterval } from "react-use";
import { TimelineLoader } from "../classes/timeline-loader";
import { useIntersectionMapCallback } from "../providers/intersection-observer";
import { NostrEvent } from "../types/nostr-event";

export function useTimelineCurserIntersectionCallback(timeline: TimelineLoader) {
  // if the cursor is set too far ahead and the last block did not overlap with the cursor
  // we need to keep loading blocks until the timeline is complete or the blocks pass the cursor
  useInterval(() => {
    timeline.loadNextBlocks();
  }, 1000);

  return useIntersectionMapCallback(
    (map) => {
      // find oldest event that is visible
      let oldestEvent: NostrEvent | undefined = undefined;
      for (const [id, intersection] of map) {
        if (!intersection.isIntersecting) continue;
        const event = timeline.events.getEvent(id);
        if (!event) continue;
        if (!oldestEvent || event.created_at < oldestEvent.created_at) {
          oldestEvent = event;
        }
      }

      if (oldestEvent) {
        timeline.setCursor(oldestEvent.created_at);
        timeline.loadNextBlocks();
      }
    },
    [timeline],
  );
}
