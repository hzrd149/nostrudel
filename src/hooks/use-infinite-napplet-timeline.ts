import type { TimelineLoader } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { useEffect, useRef, useState } from "react";
import { BehaviorSubject } from "rxjs";

import { logger } from "../helpers/debug";
import { loadTimelineWhileVisible } from "../helpers/load-timeline-window";

/** Extend Applesauce's timeline window while the list's trailing sentinel is visible. */
export default function useInfiniteNappletTimeline(loader?: TimelineLoader) {
  const end = useRef<HTMLDivElement>(null);
  const [visible] = useState(() => new BehaviorSubject(false));
  const statuses = use$(() => loader?.status$, [loader]);
  const [failure, setFailure] = useState<{ loader: TimelineLoader; message: string }>();
  const error = failure?.loader === loader ? failure?.message : undefined;
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => visible.next(entry.isIntersecting), { rootMargin: "600px" });
    if (end.current) observer.observe(end.current);
    return () => observer.disconnect();
  }, [visible]);
  useEffect(() => {
    if (!loader) return;
    const subscription = loadTimelineWhileVisible(loader, visible).subscribe({
      error: (error) => {
        logger.extend("NappletDiscovery")("Discovery failed", error);
        setFailure({ loader, message: "Could not load napplets." });
      },
    });
    return () => subscription.unsubscribe();
  }, [loader, visible]);
  const loading = !!loader && !error && (!statuses?.length || statuses.some((status) => status.state === "loading"));
  return { end, loading, error };
}
