import { useCallback } from "react";
import { Flex, SimpleGrid, Switch, useDisclosure } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";
import dayjs from "dayjs";

import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelays } from "../../hooks/use-client-relays";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import GoalCard from "./components/goal-card";
import { getGoalClosedDate } from "../../helpers/nostr/goal";
import { NostrEvent } from "nostr-tools";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { ErrorBoundary } from "../../components/error-boundary";
import { kinds } from "nostr-tools";

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
  const { loader, timeline: goals } = useTimelineLoader(
    `${listId}-browse-goals`,
    readRelays,
    filter ? { ...filter, kinds: [kinds.ZapGoal] } : undefined,
    { eventFilter },
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

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
          {goals?.map((event) => (
            <ErrorBoundary key={getEventUID(event)} event={event}>
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
