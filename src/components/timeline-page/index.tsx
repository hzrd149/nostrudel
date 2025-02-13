import { useCallback } from "react";
import { FlexProps } from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import { Expressions } from "applesauce-content/helpers";
import { TimelineLoader } from "applesauce-loaders";

import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import GenericNoteTimeline from "./generic-note-timeline";
import MediaTimeline from "./media-timeline";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "../timeline/timeline-action-and-status";
import { NostrEvent } from "../../types/nostr-event";
import TimelineHealth from "./timeline-health";
import useRouteSearchValue from "../../hooks/use-route-search-value";
import VerticalPageLayout from "../vertical-page-layout";
import useMaxPageWidth from "../../hooks/use-max-page-width";

export function useTimelinePageEventFilter() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view");

  return useCallback(
    (event: NostrEvent) => {
      if (view === "images" && !event.content.match(Expressions.link)) return false;
      return true;
    },
    [view],
  );
}

export type TimelineViewType = "timeline" | "images" | "health";

export default function TimelinePage({
  loader,
  timeline,
  header,
  ...props
}: { loader?: TimelineLoader; timeline: NostrEvent[]; header?: React.ReactNode } & Omit<
  FlexProps,
  "children" | "direction" | "gap"
>) {
  const callback = useTimelineCurserIntersectionCallback(loader);

  const viewParam = useRouteSearchValue("view", "timeline");
  const mode = (viewParam.value as TimelineViewType) ?? "timeline";

  const renderTimeline = () => {
    switch (mode) {
      case "timeline":
        return <GenericNoteTimeline timeline={timeline} />;

      case "images":
        return <MediaTimeline timeline={timeline} />;

      case "health":
        return <TimelineHealth loader={loader} timeline={timeline} />;
      default:
        return null;
    }
  };

  const maxWidth = useMaxPageWidth("6xl");
  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout maxW={maxWidth} mx="auto" gap="4" {...props}>
        {header}
        {renderTimeline()}
        <TimelineActionAndStatus loader={loader} />
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
