import { SimpleGrid } from "@chakra-ui/react";

import { kinds } from "nostr-tools";
import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import { getEventUID } from "../../../helpers/nostr/event";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import GoalCard from "../../goals/components/goal-card";

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
    <ScrollLayout>
      <IntersectionObserverProvider callback={callback}>
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="2">
          {goals?.map((goal) => (
            <GoalCard key={getEventUID(goal)} goal={goal} />
          ))}
        </SimpleGrid>
      </IntersectionObserverProvider>
    </ScrollLayout>
  );
}
