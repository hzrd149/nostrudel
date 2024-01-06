import { Button, Flex, SimpleGrid } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import RelaySelectionProvider, { useRelaySelectionContext } from "../../providers/local/relay-selection-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import Upload01 from "../../components/icons/upload-01";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { FLARE_VIDEO_KIND } from "../../helpers/nostr/flare";
import VideoCard from "./components/video-card";
import { getEventUID } from "../../helpers/nostr/events";
import { ErrorBoundary } from "../../components/error-boundary";

function VideosPage() {
  const { listId, filter } = usePeopleListContext();
  const { relays } = useRelaySelectionContext();

  const timeline = useTimelineLoader(`${listId}-videos`, relays, filter && { kinds: [FLARE_VIDEO_KIND], ...filter });

  const videos = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <VerticalPageLayout>
      <Flex gap="2">
        <PeopleListSelection />
        <RelaySelectionButton />
        <Button as={RouterLink} colorScheme="primary" ml="auto" leftIcon={<Upload01 />} to="/things/upload">
          New Thing
        </Button>
      </Flex>

      <IntersectionObserverProvider callback={callback}>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing="2">
          {videos.map((video) => (
            <ErrorBoundary>
              <VideoCard key={getEventUID(video)} video={video} />
            </ErrorBoundary>
          ))}
        </SimpleGrid>
      </IntersectionObserverProvider>
      <TimelineActionAndStatus timeline={timeline} />
    </VerticalPageLayout>
  );
}

export default function VideosView() {
  return (
    <PeopleListProvider initList="global">
      <RelaySelectionProvider>
        <VideosPage />
      </RelaySelectionProvider>
    </PeopleListProvider>
  );
}
