import { nanoid } from "nanoid";
import useRouteStateValue from "../use-route-state-value";
import { useEffect, useMemo } from "react";

/** gets or sets a unique cache key for the location */
export default function useTimelineLocationCacheKey() {
  const fallback = useMemo(() => nanoid(), []);
  const { value: cacheKey, setValue: setCacheKey } = useRouteStateValue("timeline-cache-key", "");

  useEffect(() => {
    if (!cacheKey) setCacheKey(fallback);
  }, [cacheKey, fallback]);

  // aislop-ignore-next-line ai-slop/hidden-fallback -- fallback is a stable nanoid from useMemo serving the first render until the effect above writes it into route state; this is initialization, not error recovery, so there is no failure path to make explicit
  return cacheKey || fallback;
}
