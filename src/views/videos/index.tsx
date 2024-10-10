import { Flex, SimpleGrid } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";

import useTimelineLoader from "../../hooks/use-timeline-loader";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { FLARE_VIDEO_KIND } from "../../helpers/nostr/flare";
import VideoCard from "./components/video-card";
import { ErrorBoundary } from "../../components/error-boundary";
import { useReadRelays } from "../../hooks/use-client-relays";

function VideosPage() {
  const { listId, filter } = usePeopleListContext();
  const relays = useReadRelays();

  const { loader, timeline: videos } = useTimelineLoader(
    `${listId}-videos`,
    relays,
    filter && { kinds: [FLARE_VIDEO_KIND], ...filter },
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <VerticalPageLayout>
      <Flex gap="2">
        <PeopleListSelection />
      </Flex>

      <IntersectionObserverProvider callback={callback}>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing="2">
          {videos?.map((video) => (
            <ErrorBoundary key={getEventUID(video)} event={video}>
              <VideoCard video={video} />
            </ErrorBoundary>
          ))}
        </SimpleGrid>
      </IntersectionObserverProvider>
      <TimelineActionAndStatus timeline={loader} />
    </VerticalPageLayout>
  );
}

export default function VideosView() {
  return (
    <PeopleListProvider initList="following">
      <VideosPage />
    </PeopleListProvider>
  );
}
