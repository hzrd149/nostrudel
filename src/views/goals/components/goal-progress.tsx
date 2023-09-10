import { Flex, Progress, Text } from "@chakra-ui/react";
import { NostrEvent } from "../../../types/nostr-event";
import { getGoalAmount, getGoalRelays } from "../../../helpers/nostr/goal";
import { LightningIcon } from "../../../components/icons";
import useEventZaps from "../../../hooks/use-event-zaps";
import { getEventUID } from "../../../helpers/nostr/events";
import { totalZaps } from "../../../helpers/nostr/zaps";
import { readablizeSats } from "../../../helpers/bolt11";

export default function GoalProgress({ goal }: { goal: NostrEvent }) {
  const amount = getGoalAmount(goal);
  const zaps = useEventZaps(getEventUID(goal), getGoalRelays(goal), true);
  const raised = totalZaps(zaps);

  return (
    <Flex gap="2" alignItems="center">
      <LightningIcon />
      <Progress value={(raised / amount) * 100} colorScheme="yellow" flex={1} />
      <Text>
        {readablizeSats(raised / 1000)} / {readablizeSats(amount / 1000)} ({Math.round((raised / amount) * 1000) / 10}%)
      </Text>
    </Flex>
  );
}
