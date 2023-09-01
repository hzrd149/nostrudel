import { Card, CardBody, CardHeader, CardProps, Heading, Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { getSharableEventAddress } from "../../../helpers/nip19";
import { NostrEvent } from "../../../types/nostr-event";
import { getGoalName } from "../../../helpers/nostr/goal";
import { UserAvatarLink } from "../../user-avatar-link";
import { UserLink } from "../../user-link";
import GoalProgress from "../../../views/goals/components/goal-progress";
import GoalZapButton from "../../../views/goals/components/goal-zap-button";

export default function EmbeddedGoal({ goal, ...props }: Omit<CardProps, "children"> & { goal: NostrEvent }) {
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
        <GoalZapButton goal={goal} mt="2" />
      </CardBody>
    </Card>
  );
}
