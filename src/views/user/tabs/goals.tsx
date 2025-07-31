import { SimpleGrid } from "@chakra-ui/react";

import { getEventUID } from "../../../helpers/nostr/event";
import { GOAL_KIND } from "../../../helpers/nostr/goal";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import GoalCard from "../../goals/components/goal-card";
import UserLayout from "../components/layout";
import { kinds } from "nostr-tools";

export default function UserGoalsTab() {
  const user = useParamsProfilePointer("pubkey");
  const mailboxes = useUserMailboxes(user);
  const readRelays = useReadRelays();

  const { loader, timeline: goals } = useTimelineLoader(user.pubkey + "-goals", mailboxes?.outboxes || readRelays, {
    authors: [user.pubkey],
    kinds: [kinds.ZapGoal],
  });
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <UserLayout>
      <IntersectionObserverProvider callback={callback}>
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="2">
          {goals?.map((goal) => (
            <GoalCard key={getEventUID(goal)} goal={goal} />
          ))}
        </SimpleGrid>
      </IntersectionObserverProvider>
    </UserLayout>
  );
}
