import { memo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { ButtonGroup, Card, CardBody, CardHeader, CardProps, Flex, Heading, Link, Text } from "@chakra-ui/react";

import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import { NostrEvent } from "nostr-tools";
import { getGoalClosedDate, getGoalName } from "../../../helpers/nostr/goal";
import GoalMenu from "./goal-menu";
import GoalProgress from "./goal-progress";
import GoalContents from "./goal-contents";
import GoalZapButton from "./goal-zap-button";
import GoalTopZappers from "./goal-top-zappers";
import Timestamp from "../../../components/timestamp";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";

function GoalCard({ goal, ...props }: Omit<CardProps, "children"> & { goal: NostrEvent }) {
  const address = useShareableEventAddress(goal);

  // if there is a parent intersection observer, register this card
  const ref = useEventIntersectionRef(goal);

  const closed = getGoalClosedDate(goal);

  return (
    <Card ref={ref} variant="outline" {...props}>
      <CardHeader display="flex" gap="2" alignItems="center" p="2" pb="0" flexWrap="wrap">
        <Heading size="md">
          <Link as={RouterLink} to={`/goals/${address}`}>
            {getGoalName(goal)}
          </Link>
        </Heading>
        <Text>by</Text>
        <UserAvatarLink pubkey={goal.pubkey} size="xs" />
        <UserLink pubkey={goal.pubkey} isTruncated fontWeight="bold" fontSize="md" />
        <ButtonGroup size="xs" ml="auto">
          <GoalMenu goal={goal} aria-label="emoji pack menu" />
        </ButtonGroup>
      </CardHeader>
      <CardBody p="2" display="flex" gap="2" flexDirection="column">
        {closed && (
          <Text>
            Ends: <Timestamp timestamp={closed} />
          </Text>
        )}
        <GoalProgress goal={goal} />
        <GoalContents goal={goal} />
        <Flex gap="2" alignItems="flex-end" flex={1}>
          <GoalTopZappers goal={goal} flex={1} overflow="hidden" max={4} />
          <GoalZapButton goal={goal} size="sm" ml="auto" />
        </Flex>
      </CardBody>
    </Card>
  );
}

export default memo(GoalCard);
