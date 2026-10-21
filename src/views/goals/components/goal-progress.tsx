import { Flex, Progress, Text } from "@chakra-ui/react";
import { ZapGoal } from "applesauce-common/casts";
import { use$ } from "applesauce-react/hooks";

import { LightningIcon } from "../../../components/icons";
import ValueDisplay from "../../../components/value-display";

export default function GoalProgress({ goal }: { goal: ZapGoal }) {
  const progress = use$(goal.progress$);
  if (!progress) return null;

  return (
    <Flex gap="2" alignItems="center">
      <LightningIcon />
      <Progress value={progress.percentage} colorScheme="yellow" flex={1} />
      <Text>
        <ValueDisplay sats={progress.total / 1000} /> / <ValueDisplay sats={progress.target / 1000} /> (
        {Math.round(progress.percentage * 10) / 10}%)
      </Text>
    </Flex>
  );
}
