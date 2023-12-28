import { Button, Flex, SimpleGrid } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import { FILE_KIND } from "../../helpers/nostr/files";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import RelaySelectionProvider, { useRelaySelectionContext } from "../../providers/local/relay-selection-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import Upload01 from "../../components/icons/upload-01";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";

function FilesPage() {
  const { listId, filter } = usePeopleListContext();
  const { relays } = useRelaySelectionContext();

  const timeline = useTimelineLoader(
    `${listId}-files`,
    relays,
    filter && { kinds: [FILE_KIND], "#m": ["model/stl"], ...filter },
  );

  const files = useSubject(timeline.timeline);
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
        <SimpleGrid minChildWidth="20rem" spacing="2"></SimpleGrid>
      </IntersectionObserverProvider>
      <TimelineActionAndStatus timeline={timeline} />
    </VerticalPageLayout>
  );
}

export default function FilesView() {
  return (
    <PeopleListProvider initList="global">
      <RelaySelectionProvider>
        <FilesPage />
      </RelaySelectionProvider>
    </PeopleListProvider>
  );
}
