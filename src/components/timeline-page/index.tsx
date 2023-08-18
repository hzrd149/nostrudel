import { useCallback } from "react";
import { Flex, FlexProps, SimpleGrid } from "@chakra-ui/react";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import GenericNoteTimeline from "./generic-note-timeline";
import { LightboxProvider } from "../lightbox-provider";
import MediaTimeline from "./media-timeline";
import { TimelineLoader } from "../../classes/timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "./timeline-action-and-status";
import { useSearchParams } from "react-router-dom";
import { NostrEvent } from "../../types/nostr-event";
import { matchLink } from "../../helpers/regexp";
import TimelineHealth from "./timeline-health";

export function useTimelinePageEventFilter() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view");

  return useCallback(
    (event: NostrEvent) => {
      if (view === "images" && !event.content.match(matchLink)) return false;
      return true;
    },
    [view],
  );
}

export type TimelineViewType = "timeline" | "images" | "health";

export default function TimelinePage({
  timeline,
  header,
  ...props
}: { timeline: TimelineLoader; header?: React.ReactNode } & Omit<FlexProps, "children" | "direction" | "gap">) {
  const callback = useTimelineCurserIntersectionCallback(timeline);

  const [params, setParams] = useSearchParams();
  const mode = (params.get("view") as TimelineViewType) ?? "timeline";

  const renderTimeline = () => {
    switch (mode) {
      case "timeline":
        return <GenericNoteTimeline timeline={timeline} />;

      case "images":
        return (
          <LightboxProvider>
            <SimpleGrid columns={[1, 2, 2, 3, 4, 5]} gap="4">
              <MediaTimeline timeline={timeline} />
            </SimpleGrid>
          </LightboxProvider>
        );

      case "health":
        return <TimelineHealth timeline={timeline} />;
      default:
        return null;
    }
  };
  return (
    <IntersectionObserverProvider<string> callback={callback}>
      <Flex direction="column" gap="2" {...props}>
        {header}
        {renderTimeline()}
        <TimelineActionAndStatus timeline={timeline} />
      </Flex>
    </IntersectionObserverProvider>
  );
}
