import { useEffect, useRef } from "react";
import { useInterval } from "react-use";
import { NostrEvent } from "nostr-tools";
import { TimelineLoader } from "applesauce-loaders/loaders";

import { useCachedIntersectionMapCallback } from "../providers/local/intersection-observer";
import { eventStore } from "../services/event-store";

export function useTimelineCurserIntersectionCallback(loader?: TimelineLoader) {
  const oldest = useRef<NostrEvent | undefined>(undefined);

  // Request next batch when components mounts
  useEffect(() => {
    if (loader)
      setTimeout(() => {
        loader(-Infinity);
      }, 100);
  }, [loader]);

  // if the cursor is set too far ahead and the last block did not overlap with the cursor
  // we need to keep loading blocks until the timeline is complete or the blocks pass the cursor
  useInterval(() => {
    if (oldest.current) loader?.(oldest.current.created_at - 1);
    else loader?.(-Infinity);
  }, 1000);

  return useCachedIntersectionMapCallback(
    (map) => {
      // find oldest event that is visible
      for (const [id, entry] of map) {
        if (!entry.isIntersecting) continue;
        const event = eventStore.getEvent(id);
        if (!event) continue;
        if (!oldest.current || event.created_at < oldest.current.created_at - 1) {
          oldest.current = event;
        }
      }

      if (oldest.current) loader?.(oldest.current.created_at);
    },
    [loader],
  );
}
