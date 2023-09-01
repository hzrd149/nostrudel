import { memo, useRef } from "react";
import { Link as RouterLink } from "react-router-dom";
import { ButtonGroup, Card, CardBody, CardHeader, CardProps, Heading, Link, Text } from "@chakra-ui/react";

import { UserAvatarLink } from "../../../components/user-avatar-link";
import { UserLink } from "../../../components/user-link";
import { getSharableEventAddress } from "../../../helpers/nip19";
import { NostrEvent } from "../../../types/nostr-event";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { getEventUID } from "../../../helpers/nostr/events";
import { getGoalClosedDate, getGoalName } from "../../../helpers/nostr/goal";
import GoalMenu from "./goal-menu";
import GoalProgress from "./goal-progress";
import GoalContents from "./goal-contents";
import dayjs from "dayjs";

function GoalCard({ goal, ...props }: Omit<CardProps, "children"> & { goal: NostrEvent }) {
  const nevent = getSharableEventAddress(goal);

  // if there is a parent intersection observer, register this card
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(goal));

  const closed = getGoalClosedDate(goal);

  return (
    <Card ref={ref} variant="outline" {...props}>
      <CardHeader display="flex" gap="2" alignItems="center" p="2" pb="0" flexWrap="wrap">
        <Heading size="md">
          <Link as={RouterLink} to={`/goals/${nevent}`}>
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
      <CardBody p="2" display="flex" gap="4" flexDirection="column">
        {closed && <Text>Ends: {dayjs.unix(closed).fromNow()}</Text>}
        <GoalProgress goal={goal} />
        <GoalContents goal={goal} />
      </CardBody>
    </Card>
  );
}

export default memo(GoalCard);
