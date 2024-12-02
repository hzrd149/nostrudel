import { Link as RouterLink } from "react-router-dom";
import { Card, CardBody, CardHeader, CardProps, Flex, Heading, Link } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { getGoalName } from "../../../helpers/nostr/goal";
import GoalProgress from "../../goals/components/goal-progress";
import GoalTopZappers from "../../goals/components/goal-top-zappers";
import GoalZapButton from "../../goals/components/goal-zap-button";
import useStreamGoal from "../../../hooks/use-stream-goal";
import { getSharableEventAddress } from "../../../services/event-relay-hint";

export default function StreamGoal({ stream, ...props }: Omit<CardProps, "children"> & { stream: NostrEvent }) {
  const goal = useStreamGoal(stream);

  if (!goal) return null;
  const address = getSharableEventAddress(goal);

  return (
    <Card direction="column" gap="1" {...props}>
      <CardHeader px="2" pt="2" pb="0">
        <Heading size="md">
          <Link as={RouterLink} to={`/goals/${address}`}>
            {getGoalName(goal)}
          </Link>
        </Heading>
      </CardHeader>
      <CardBody p="2" display="flex" gap="2" flexDirection="column">
        <GoalProgress goal={goal} />
        <Flex gap="2" alignItems="flex-end">
          <GoalTopZappers goal={goal} overflow="hidden" flex={1} />
          <GoalZapButton goal={goal} flexShrink={0} />
        </Flex>
      </CardBody>
    </Card>
  );
}
