import { useCallback } from "react";
import { Flex, FlexProps } from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";

import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import GenericNoteTimeline from "./generic-note-timeline";
import MediaTimeline from "./media-timeline";
import TimelineLoader from "../../classes/timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "../timeline/timeline-action-and-status";
import { NostrEvent } from "../../types/nostr-event";
import { getMatchLink } from "../../helpers/regexp";
import TimelineHealth from "./timeline-health";
import useRouteSearchValue from "../../hooks/use-route-search-value";
import VerticalPageLayout from "../vertical-page-layout";

export function useTimelinePageEventFilter() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view");

  return useCallback(
    (event: NostrEvent) => {
      if (view === "images" && !event.content.match(getMatchLink())) return false;
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
}: { loader: TimelineLoader; timeline: NostrEvent[]; header?: React.ReactNode } & Omit<
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
  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout maxW="6xl" mx="auto" {...props}>
        {header}
        {renderTimeline()}
        <TimelineActionAndStatus timeline={loader} />
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
