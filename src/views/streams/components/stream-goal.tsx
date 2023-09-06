import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Card, CardBody, CardHeader, CardProps, Flex, Heading, Link } from "@chakra-ui/react";

import { ParsedStream, getATag } from "../../../helpers/nostr/stream";
import { NostrEvent } from "../../../types/nostr-event";
import { NostrRequest } from "../../../classes/nostr-request";
import { useReadRelayUrls } from "../../../hooks/use-client-relays";
import { GOAL_KIND, getGoalName } from "../../../helpers/nostr/goal";
import GoalProgress from "../../goals/components/goal-progress";
import { getSharableEventAddress } from "../../../helpers/nip19";
import GoalTopZappers from "../../goals/components/goal-top-zappers";
import GoalZapButton from "../../goals/components/goal-zap-button";
import singleEventService from "../../../services/single-event";

export default function StreamGoal({ stream, ...props }: Omit<CardProps, "children"> & { stream: ParsedStream }) {
  const [goal, setGoal] = useState<NostrEvent>();
  const relays = useReadRelayUrls(stream.relays);

  useEffect(() => {
    if (stream.goal) {
      singleEventService.requestEvent(stream.goal, relays).then((event) => {
        setGoal(event);
      });
    } else {
      const request = new NostrRequest(relays);
      request.onEvent.subscribe((event) => {
        setGoal(event);
      });
      request.start({ "#a": [getATag(stream)], kinds: [GOAL_KIND] });
    }
  }, [stream.identifier, stream.goal, relays.join("|")]);

  if (!goal) return null;
  const nevent = getSharableEventAddress(goal);
  return (
    <Card direction="column" gap="1" {...props}>
      <CardHeader px="2" pt="2" pb="0">
        <Heading size="md">
          <Link as={RouterLink} to={`/goals/${nevent}`}>
            {getGoalName(goal)}
          </Link>
        </Heading>
      </CardHeader>
      <CardBody p="2" display="flex" gap="2" flexDirection="column">
        <GoalProgress goal={goal} />
        <Flex gap="2" alignItems="flex-end">
          <GoalTopZappers goal={goal} overflow="hidden" />
          <GoalZapButton goal={goal} flexShrink={0} />
        </Flex>
      </CardBody>
    </Card>
  );
}
