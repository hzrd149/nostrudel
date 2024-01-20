import { useCallback } from "react";
import { Flex, SimpleGrid, Switch, useDisclosure } from "@chakra-ui/react";
import dayjs from "dayjs";

import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelays } from "../../hooks/use-client-relays";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useSubject from "../../hooks/use-subject";
import GoalCard from "./components/goal-card";
import { getEventUID } from "../../helpers/nostr/events";
import { GOAL_KIND, getGoalClosedDate } from "../../helpers/nostr/goal";
import { NostrEvent } from "../../types/nostr-event";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { ErrorBoundary } from "../../components/error-boundary";

function GoalsBrowsePage() {
  const { filter, listId } = usePeopleListContext();
  const showClosed = useDisclosure();

  const readRelays = useReadRelays();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      const closed = getGoalClosedDate(event);
      if (!showClosed.isOpen && closed && dayjs().isAfter(dayjs.unix(closed))) return false;
      return true;
    },
    [showClosed.isOpen],
  );
  const timeline = useTimelineLoader(
    `${listId}-browse-goals`,
    readRelays,
    filter ? { ...filter, kinds: [GOAL_KIND] } : undefined,
    { eventFilter },
  );

  const goals = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <Flex gap="2" alignItems="center" wrap="wrap">
          <PeopleListSelection />
          <Switch isChecked={showClosed.isOpen} onChange={showClosed.onToggle}>
            Show ended
          </Switch>
        </Flex>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="2">
          {goals.map((event) => (
            <ErrorBoundary key={getEventUID(event)}>
              <GoalCard goal={event} />
            </ErrorBoundary>
          ))}
        </SimpleGrid>
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}

export default function GoalsBrowseView() {
  return (
    <PeopleListProvider>
      <GoalsBrowsePage />
    </PeopleListProvider>
  );
}
