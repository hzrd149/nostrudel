import { Flex, Progress, Text } from "@chakra-ui/react";

import { NostrEvent } from "nostr-tools";
import { getGoalAmount, getGoalRelays } from "../../../helpers/nostr/goal";
import { LightningIcon } from "../../../components/icons";
import useEventZaps from "../../../hooks/use-event-zaps";
import { getEventUID } from "../../../helpers/nostr/event";
import { totalZaps } from "../../../helpers/nostr/zaps";
import { humanReadableSats } from "../../../helpers/lightning";

export default function GoalProgress({ goal }: { goal: NostrEvent }) {
  const amount = getGoalAmount(goal);
  const zaps = useEventZaps(getEventUID(goal), getGoalRelays(goal), true);
  const raised = totalZaps(zaps);

  return (
    <Flex gap="2" alignItems="center">
      <LightningIcon />
      <Progress value={(raised / amount) * 100} colorScheme="yellow" flex={1} />
      <Text>
        {humanReadableSats(raised / 1000)} / {humanReadableSats(amount / 1000)} (
        {Math.round((raised / amount) * 1000) / 10}%)
      </Text>
    </Flex>
  );
}
