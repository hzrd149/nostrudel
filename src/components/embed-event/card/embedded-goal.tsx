import { Card, CardBody, CardHeader, CardProps, Flex, Heading, Link, Text } from "@chakra-ui/react";
import { ZapGoal } from "applesauce-common/casts";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";

import useCastEvent from "../../../hooks/use-cast-event";
import { getSharableEventAddress } from "../../../services/relay-hints";
import GoalProgress from "../../../views/goals/components/goal-progress";
import GoalTopZappers from "../../../views/goals/components/goal-top-zappers";
import GoalZapButton from "../../../views/goals/components/goal-zap-button";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";

export type EmbeddedGoalOptions = {
  showActions?: boolean;
};

export type EmbeddedGoalProps = Omit<CardProps, "children"> & { goal: NostrEvent } & EmbeddedGoalOptions;

export default function EmbeddedGoal({ goal: event, showActions = true, ...props }: EmbeddedGoalProps) {
  const nevent = useMemo(() => getSharableEventAddress(event), [event]);
  const goal = useCastEvent(event, ZapGoal);
  if (!goal) return null;

  return (
    <Card {...props}>
      <CardHeader display="flex" gap="2" alignItems="center" p="2" pb="0" flexWrap="wrap">
        <Heading size="md">
          <Link as={RouterLink} to={`/goals/${nevent}`}>
            {goal.description}
          </Link>
        </Heading>
        <Text>by</Text>
        <UserAvatarLink pubkey={goal.author.pubkey} size="xs" />
        <UserLink pubkey={goal.author.pubkey} isTruncated fontWeight="bold" fontSize="md" />
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
