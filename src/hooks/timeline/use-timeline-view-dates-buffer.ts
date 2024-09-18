import useTimelineViewDates from "./use-timeline-view-dates";

export default function useTimelineViewDatesBuffer(
  cacheKey: string,
  init: { min?: number; max?: number },
  timeline: { id: string; created_at: number }[],
  buffer: number,
  initialRender: number,
) {
  // pass timeline in as reset
  let { min, max } = useTimelineViewDates(init, cacheKey);

  // if we don't know the max date in the view, set it to Infinity
  if (!max || timeline.length <= buffer) {
    max = Infinity;
  } else {
    for (let i = 0; i < timeline.length; i++) {
      const event = timeline[i];
      const bufferEvent = timeline[i + buffer];

      if (bufferEvent && bufferEvent?.created_at <= max) {
        max = event.created_at;
        break;
      }
    }
  }

  let minBuffer = min ? buffer : buffer + initialRender;
  for (let i = 0; i < timeline.length; i++) {
    const event = timeline[i];

    // if min date is not set, start at first event in timeline
    if (!min) min = event.created_at;
    // find minBuffer number of events below min date
    else if (event.created_at < min) {
      min = event.created_at;
      if (minBuffer-- === 0) break;
    }
  }

  return { min: min as number, max: max as number };
}
