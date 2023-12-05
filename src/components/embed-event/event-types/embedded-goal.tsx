import { Card, CardBody, CardHeader, CardProps, Flex, Heading, Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { getSharableEventAddress } from "../../../helpers/nip19";
import { NostrEvent } from "../../../types/nostr-event";
import { getGoalName } from "../../../helpers/nostr/goal";
import UserAvatarLink from "../../user-avatar-link";
import UserLink from "../../user-link";
import GoalProgress from "../../../views/goals/components/goal-progress";
import GoalZapButton from "../../../views/goals/components/goal-zap-button";
import GoalTopZappers from "../../../views/goals/components/goal-top-zappers";

export type EmbeddedGoalOptions = {
  showActions?: boolean;
};

export type EmbeddedGoalProps = Omit<CardProps, "children"> & { goal: NostrEvent } & EmbeddedGoalOptions;

export default function EmbeddedGoal({ goal, showActions = true, ...props }: EmbeddedGoalProps) {
  const nevent = getSharableEventAddress(goal);

  return (
    <Card {...props}>
      <CardHeader display="flex" gap="2" alignItems="center" p="2" pb="0" flexWrap="wrap">
        <Heading size="md">
          <Link as={RouterLink} to={`/goals/${nevent}`}>
            {getGoalName(goal)}
          </Link>
        </Heading>
        <Text>by</Text>
        <UserAvatarLink pubkey={goal.pubkey} size="xs" />
        <UserLink pubkey={goal.pubkey} isTruncated fontWeight="bold" fontSize="md" />
      </CardHeader>
      <CardBody p="2">
        <GoalProgress goal={goal} />
        <Flex gap="2" alignItems="flex-end">
          <GoalTopZappers goal={goal} overflow="hidden" />
          {showActions && <GoalZapButton goal={goal} flexShrink={0} />}
        </Flex>
      </CardBody>
    </Card>
  );
}
