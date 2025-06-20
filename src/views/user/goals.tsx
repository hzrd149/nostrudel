import { useOutletContext } from "react-router-dom";
import { SimpleGrid } from "@chakra-ui/react";

import { useAdditionalRelayContext } from "../../providers/local/additional-relay";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { getEventUID } from "../../helpers/nostr/event";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { GOAL_KIND } from "../../helpers/nostr/goal";
import GoalCard from "../goals/components/goal-card";
import VerticalPageLayout from "../../components/vertical-page-layout";

export default function UserGoalsTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const { loader, timeline: goals } = useTimelineLoader(pubkey + "-goals", readRelays, {
    authors: [pubkey],
    kinds: [GOAL_KIND],
  });
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="2">
          {goals?.map((goal) => <GoalCard key={getEventUID(goal)} goal={goal} />)}
        </SimpleGrid>
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
