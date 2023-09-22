import { useOutletContext } from "react-router-dom";
import { Flex, SimpleGrid } from "@chakra-ui/react";

import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import { getEventUID } from "../../helpers/nostr/events";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { GOAL_KIND } from "../../helpers/nostr/goal";
import GoalCard from "../goals/components/goal-card";
import VerticalPageLayout from "../../components/vertical-page-layout";

export default function UserGoalsTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const timeline = useTimelineLoader(pubkey + "-goals", readRelays, {
    authors: [pubkey],
    kinds: [GOAL_KIND],
  });
  const goals = useSubject(timeline.timeline);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="2">
          {goals.map((goal) => (
            <GoalCard key={getEventUID(goal)} goal={goal} />
          ))}
        </SimpleGrid>
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
