import { Flex, SimpleGrid, Switch, useDisclosure } from "@chakra-ui/react";

import PeopleListProvider, { usePeopleListContext } from "../../providers/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useSubject from "../../hooks/use-subject";
import GoalCard from "./components/goal-card";
import { getEventUID } from "../../helpers/nostr/events";
import { GOAL_KIND, getGoalClosedDate } from "../../helpers/nostr/goal";
import { SwipeState } from "yet-another-react-lightbox";
import { useCallback } from "react";
import { NostrEvent } from "../../types/nostr-event";
import dayjs from "dayjs";

function GoalsBrowsePage() {
  const { filter, listId } = usePeopleListContext();
  const showClosed = useDisclosure();

  const readRelays = useReadRelayUrls();
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
    { ...filter, kinds: [GOAL_KIND] },
    { enabled: !!filter, eventFilter },
  );

  const goals = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <Flex direction="column" gap="2" p="2" pb="10">
        <Flex gap="2" alignItems="center" wrap="wrap">
          <PeopleListSelection />
          <Switch isChecked={showClosed.isOpen} onChange={showClosed.onToggle}>
            Show ended
          </Switch>
        </Flex>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="2">
          {goals.map((event) => (
            <GoalCard key={getEventUID(event)} goal={event} />
          ))}
        </SimpleGrid>
      </Flex>
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
