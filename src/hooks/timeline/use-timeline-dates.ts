import { useEffect } from "react";
import TimelineLoader from "../../classes/timeline-loader";
import useMinNumber from "./use-min-number";
import { NumberCache } from "./use-number-cache";
import useTimelineViewDatesBuffer from "./use-timeline-view-dates-buffer";

export function useTimelineDates(
  timeline: { id: string; created_at: number }[] | TimelineLoader,
  cache: NumberCache,
  buffer = 5,
  initialRender = 10,
) {
  const dates = useTimelineViewDatesBuffer(
    cache.key,
    { min: cache.get("min"), max: cache.get("max") },
    Array.isArray(timeline) ? timeline : timeline.timeline.value,
    buffer,
    initialRender,
  );

  const cursor = useMinNumber(cache.key, cache.get("cursor"), dates.min);

  // cache dates
  useEffect(() => {
    if (dates.min) cache.set("min", dates.min);
    if (dates.max) cache.set("max", dates.max);
    cache.set("cursor", cursor);
  }, [dates.max, dates.min, cursor, cache.set]);

  return { ...dates, cursor: cursor };
}
