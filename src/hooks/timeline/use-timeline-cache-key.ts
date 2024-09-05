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

  return cacheKey || fallback;
}
