import { FlexProps } from "@chakra-ui/react";
// v5: Expressions was removed, define URL regex inline
const URL_REGEX = /https?:\/\/[^\s]+/g;
import { use$ } from "applesauce-react/hooks";
import { TimelineLoader } from "applesauce-loaders/loaders";
import { NostrEvent } from "nostr-tools";
import { useCallback, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

import { getTimelineRange } from "../../helpers/timeline-range";
import useMinNumber from "../../hooks/timeline/use-min-number";
import useRouteSearchValue from "../../hooks/use-route-search-value";
import IntersectionObserverProvider, {
  useCachedIntersectionMapCallback,
} from "../../providers/local/intersection-observer";
import { eventStore } from "../../services/event-store";
import VerticalPageLayout from "../vertical-page-layout";
import GenericNoteTimeline from "./generic-note-timeline";
import MediaTimeline from "./media-timeline";
import TimelineRangeEnd from "./timeline-range-end";

export function useTimelinePageEventFilter() {
  const [params] = useSearchParams();
  const view = params.get("view");

  return useCallback(
    (event: NostrEvent) => {
      if (view === "images" && !event.content.match(URL_REGEX)) return false;
      return true;
    },
    [view],
  );
}

export type TimelineViewType = "timeline" | "images";

export default function TimelinePage({
  loader,
  timeline,
  header,
  ...props
}: { loader?: TimelineLoader; timeline: NostrEvent[]; header?: React.ReactNode } & Omit<
  FlexProps,
  "children" | "direction" | "gap" | "as"
>) {
  const range = loader ? getTimelineRange(loader) : undefined;
  const loadedSince = use$(range?.range$)?.since;
  const { pathname, search } = useLocation();
  // Relay changes replace the loader with a fresh range at now. Keep notes already
  // on screen mounted while that loader catches up; only navigation resets this floor.
  const oldest = useMinNumber(pathname + search, loadedSince);
  const since = oldest === Infinity ? undefined : oldest;

  // Load the visible part of the timeline and grow the rendered range while the page is open
  useEffect(() => {
    if (!range) return;
    const sub = range.run().subscribe();
    return () => sub.unsubscribe();
  }, [range]);

  // Report the oldest note on screen so the loader keeps it covered
  const callback = useCachedIntersectionMapCallback(
    (entries) => {
      if (!range) return;
      let oldest: number | undefined;
      for (const [id, entry] of entries) {
        if (!entry.isIntersecting) continue;
        const event = eventStore.getEvent(id);
        if (event) oldest = Math.min(oldest ?? Infinity, event.created_at);
      }
      if (oldest !== range.view$.value.visibleSince) range.view$.next({ ...range.view$.value, visibleSince: oldest });
    },
    [range],
  );

  const viewParam = useRouteSearchValue("view", "timeline");
  const mode = (viewParam.value as TimelineViewType) ?? "timeline";

  const renderTimeline = () => {
    switch (mode) {
      case "timeline":
        return <GenericNoteTimeline timeline={timeline} since={since} />;

      case "images":
        return <MediaTimeline timeline={timeline} since={since} />;
      default:
        return null;
    }
  };

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout mx="auto" gap="4" {...props}>
        {header}
        {renderTimeline()}
        {range && <TimelineRangeEnd range={range} />}
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
