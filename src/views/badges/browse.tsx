import { Flex, SimpleGrid } from "@chakra-ui/react";
import { kinds } from "nostr-tools";

import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelays } from "../../hooks/use-client-relays";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useSubject from "../../hooks/use-subject";
import { getEventUID } from "../../helpers/nostr/events";
import BadgeCard from "./components/badge-card";
import VerticalPageLayout from "../../components/vertical-page-layout";

function BadgesBrowsePage() {
  const { filter, listId } = usePeopleListContext();

  const readRelays = useReadRelays();
  const timeline = useTimelineLoader(
    `${listId}-badges`,
    readRelays,
    filter ? { ...filter, kinds: [kinds.BadgeDefinition] } : undefined,
  );

  const lists = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <Flex gap="2" alignItems="center" wrap="wrap">
          <PeopleListSelection />
        </Flex>

        <SimpleGrid columns={{ base: 1, sm: 2, md: 2, lg: 3, xl: 4 }} spacing="2">
          {lists.map((badge) => (
            <BadgeCard key={getEventUID(badge)} badge={badge} />
          ))}
        </SimpleGrid>
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}

export default function BadgesBrowseView() {
  return (
    <PeopleListProvider>
      <BadgesBrowsePage />
    </PeopleListProvider>
  );
}
