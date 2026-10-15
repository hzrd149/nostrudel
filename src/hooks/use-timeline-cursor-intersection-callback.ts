import { TimelineLoader } from "applesauce-loaders/loaders";
import { useEffect, useMemo } from "react";
import { BehaviorSubject, filter, interval, map, merge, throttleTime, timer } from "rxjs";

import { logger } from "../helpers/debug";
import { loadTimelineWindow } from "../helpers/load-timeline-window";
import { useCachedIntersectionMapCallback } from "../providers/local/intersection-observer";
import { eventStore } from "../services/event-store";

const log = logger.extend("TimelineCursor");

export function useTimelineCurserIntersectionCallback(loader?: TimelineLoader) {
  const cursor$ = useMemo(() => (loader ? new BehaviorSubject<number | undefined>(undefined) : undefined), [loader]);

  useEffect(() => {
    if (!loader || !cursor$) return;

    const visible$ = cursor$.pipe(filter((cursor): cursor is number => cursor !== undefined));
    const updates$ = merge(
      timer(100).pipe(map(() => -Infinity)),
      visible$.pipe(throttleTime(1000, undefined, { leading: true, trailing: true })),
      // Sparse feeds can need several blocks to reach the same visible cursor. The loader skips
      // these ticks once its loaded range covers the cursor, so idle ticks do not send requests.
      interval(1000).pipe(
        map(() => cursor$.value),
        filter((cursor): cursor is number => cursor !== undefined),
      ),
    );
    const subscription = loadTimelineWindow(loader, updates$).subscribe({
      error: (error) => log("Failed to load timeline", error),
    });
    return () => subscription.unsubscribe();
  }, [loader, cursor$]);

  return useCachedIntersectionMapCallback(
    (entries) => {
      let oldest: number | undefined;
      for (const [id, entry] of entries) {
        if (!entry.isIntersecting) continue;
        const event = eventStore.getEvent(id);
        if (event) oldest = Math.min(oldest ?? Infinity, event.created_at);
      }
      if (cursor$ && oldest !== cursor$.value) cursor$.next(oldest);
    },
    [cursor$],
  );
}
