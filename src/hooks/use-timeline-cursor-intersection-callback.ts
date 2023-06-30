import { useInterval } from "react-use";
import { TimelineLoader } from "../classes/timeline-loader";
import { useIntersectionMapCallback } from "../providers/intersection-observer";

export function useTimelineCurserIntersectionCallback(timeline: TimelineLoader) {
  // if the cursor is set too far ahead and the last block did not overlap with the cursor
  // we need to keep loading blocks until the timeline is complete or the blocks pass the cursor
  useInterval(() => {
    timeline.loadNextBlocks();
  }, 1000);

  return useIntersectionMapCallback<string>(
    (map) => {
      // find oldest event that is visible
      for (let i = timeline.timeline.value.length - 1; i >= 0; i--) {
        const event = timeline.timeline.value[i];

        if (map.get(event.id)?.isIntersecting) {
          timeline.setCursor(event.created_at);
          timeline.loadNextBlocks();
          return;
        }
      }
    },
    [timeline]
  );
}
