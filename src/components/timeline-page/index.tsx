import { FlexProps } from "@chakra-ui/react";
import { Expressions } from "applesauce-content/helpers";
import { TimelineLoader } from "applesauce-loaders/loaders";
import { NostrEvent } from "nostr-tools";
import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import useRouteSearchValue from "../../hooks/use-route-search-value";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import LoadMoreButton from "../timeline/load-more-button";
import VerticalPageLayout from "../vertical-page-layout";
import GenericNoteTimeline from "./generic-note-timeline";
import MediaTimeline from "./media-timeline";

export function useTimelinePageEventFilter() {
  const [params] = useSearchParams();
  const view = params.get("view");

  return useCallback(
    (event: NostrEvent) => {
      if (view === "images" && !event.content.match(Expressions.link)) return false;
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
      default:
        return null;
    }
  };

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout mx="auto" gap="4" {...props}>
        {header}
        {renderTimeline()}
        <LoadMoreButton loader={loader} />
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
