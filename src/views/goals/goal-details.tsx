import { useNavigate } from "react-router-dom";
import { Button, ButtonGroup, Divider, Flex, Heading, Spacer, Spinner, Text } from "@chakra-ui/react";
import { ZapGoal } from "applesauce-common/casts";

import { ChevronLeftIcon } from "../../components/icons";
import GoalMenu from "./components/goal-menu";
import GoalProgress from "./components/goal-progress";
import useCastEvent from "../../hooks/use-cast-event";
import useSingleEvent from "../../hooks/use-single-event";
import UserAvatar from "../../components/user/user-avatar";
import UserLink from "../../components/user/user-link";
import GoalContents from "./components/goal-contents";
import GoalZapList from "./components/goal-zap-list";
import GoalZapButton from "./components/goal-zap-button";
import VerticalPageLayout from "../../components/vertical-page-layout";
import useParamsEventPointer from "../../hooks/use-params-event-pointer";
import ValueDisplay from "../../components/value-display";

export default function GoalDetailsView() {
  const navigate = useNavigate();
  const pointer = useParamsEventPointer("id");

  const event = useSingleEvent(pointer);
  const goal = useCastEvent(event, ZapGoal);
  if (!event) return <Spinner />;
  if (!goal) return <Text>Invalid zap goal</Text>;

  return (
    <VerticalPageLayout overflow="hidden" h="full">
      <Flex gap="2" alignItems="center">
        <Button onClick={() => navigate(-1)} leftIcon={<ChevronLeftIcon />}>
          Back
        </Button>

        <Heading size="md" isTruncated>
          {goal.description} (<ValueDisplay sats={(goal.amount ?? 0) / 1000} />)
        </Heading>

        <Spacer />

        <ButtonGroup>
          <GoalZapButton goal={goal} />
          <GoalMenu aria-label="More options" goal={goal.event} />
        </ButtonGroup>
      </Flex>
      <Flex gap="2" alignItems="center">
        <UserAvatar pubkey={goal.author.pubkey} size="sm" />
        <UserLink pubkey={goal.author.pubkey} fontWeight="bold" fontSize="lg" />
      </Flex>

      <GoalContents goal={goal} />
      <Heading size="md" mt="2">
        Progress:
      </Heading>
      <GoalProgress goal={goal} />
      <Heading size="md" mt="2">
        Contributors:
      </Heading>
      <Divider />
      <GoalZapList goal={goal} />
    </VerticalPageLayout>
  );
}
