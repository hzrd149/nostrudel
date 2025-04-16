import { useEffect, useRef, useState } from "react";

import { getEntryDetails, useIntersectionObserver } from "../../providers/local/intersection-observer";

/** tracks the min and max dates/entries that are visible in the view */
export default function useTimelineViewDates(init: { min?: number; max?: number }, reset?: string) {
  const [dates, setDates] = useState<{ min?: number; max?: number }>(init);
  const [cache] = useState(() => new Map<string, { entry: IntersectionObserverEntry; ts: number; id: string }>());

  // when reset changes, forget the dates
  const prev = useRef(reset);
  useEffect(() => {
    if (prev.current && prev.current !== reset) {
      setDates({});
      cache.clear();
    }
    prev.current = reset;
  }, [setDates, cache, reset]);

  const { subject: intersectionSubject } = useIntersectionObserver();

  useEffect(() => {
    const listener = (entities: IntersectionObserverEntry[]) => {
      // update cache
      for (const entry of entities) {
        const details = getEntryDetails(entry);
        if (details?.id && details?.ts) cache.set(details.id, { entry, ts: parseInt(details.ts), id: details.id });
      }

      // get a sorted list of all entries
      const timeline = Array.from(cache.values()).sort((a, b) => b.ts - a.ts);

      let max: number = -Infinity;
      let min: number = Infinity;
      let foundVisible = false;

      for (let i = 0; i < timeline.length; i++) {
        const { entry, ts } = timeline[i];

        const isIntersecting = entry.isIntersecting;

        if (!isIntersecting) {
          // found an entry below the view
          if (foundVisible) {
            // move the min date
            if (ts < min) min = ts;

            break;
          } else {
            // found an event above the view
            continue;
          }
        } else {
          // found visible event
          foundVisible = true;

          if (ts > max) max = ts;
          if (ts < min) min = ts;
        }
      }

      setDates({
        min: min !== Infinity ? min : undefined,
        max: max !== -Infinity ? max : undefined,
      });
    };

    const sub = intersectionSubject.subscribe(listener);
    return () => {
      sub.unsubscribe();
    };
  }, [setDates, intersectionSubject, cache]);

  return dates;
}
