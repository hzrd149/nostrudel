import { useCallback, useRef } from "react";
import { Flex, Grid } from "@chakra-ui/react";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import GenericNoteTimeline from "./generic-note-timeline";
import { ImageGalleryProvider } from "../image-gallery";
import MediaTimeline from "./media-timeline";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { TimelineLoader } from "../../classes/timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "./timeline-action-and-status";
import { useSearchParams } from "react-router-dom";
import { NostrEvent } from "../../types/nostr-event";
import { matchImageUrls } from "../../helpers/regexp";

export function useTimelinePageEventFilter() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view");

  return useCallback(
    (event: NostrEvent) => {
      if (view === "images" && !event.content.match(matchImageUrls)) return false;
      return true;
    },
    [view]
  );
}

export type TimelineViewType = "timeline" | "images";

export default function TimelinePage({ timeline, header }: { timeline: TimelineLoader; header?: React.ReactNode }) {
  const isMobile = useIsMobile();

  const callback = useTimelineCurserIntersectionCallback(timeline);

  const [params, setParams] = useSearchParams();
  const mode = (params.get("view") as TimelineViewType) ?? "timeline";

  const renderTimeline = () => {
    switch (mode) {
      case "timeline":
        return <GenericNoteTimeline timeline={timeline} />;

      case "images":
        return (
          <ImageGalleryProvider>
            <Grid templateColumns={`repeat(${isMobile ? 2 : 5}, 1fr)`} gap="4">
              <MediaTimeline timeline={timeline} />
            </Grid>
          </ImageGalleryProvider>
        );
      default:
        return null;
    }
  };
  return (
    <IntersectionObserverProvider<string> callback={callback}>
      <Flex direction="column" gap="2" pt="4" pb="8">
        {header}
        {renderTimeline()}
        <TimelineActionAndStatus timeline={timeline} />
      </Flex>
    </IntersectionObserverProvider>
  );
}
