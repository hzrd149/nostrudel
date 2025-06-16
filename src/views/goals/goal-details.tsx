import { useNavigate } from "react-router-dom";
import { Button, ButtonGroup, Divider, Flex, Heading, Spacer, Spinner } from "@chakra-ui/react";

import { ChevronLeftIcon } from "../../components/icons";
import GoalMenu from "./components/goal-menu";
import { getGoalAmount, getGoalName } from "../../helpers/nostr/goal";
import GoalProgress from "./components/goal-progress";
import useSingleEvent from "../../hooks/use-single-event";
import UserAvatar from "../../components/user/user-avatar";
import UserLink from "../../components/user/user-link";
import GoalContents from "./components/goal-contents";
import GoalZapList from "./components/goal-zap-list";
import { humanReadableSats } from "../../helpers/lightning";
import GoalZapButton from "./components/goal-zap-button";
import VerticalPageLayout from "../../components/vertical-page-layout";
import useParamsEventPointer from "../../hooks/use-params-event-pointer";

export default function GoalDetailsView() {
  const navigate = useNavigate();
  const pointer = useParamsEventPointer("id");

  const goal = useSingleEvent(pointer);
  if (!goal) return <Spinner />;

  return (
    <VerticalPageLayout overflow="hidden" h="full">
      <Flex gap="2" alignItems="center">
        <Button onClick={() => navigate(-1)} leftIcon={<ChevronLeftIcon />}>
          Back
        </Button>

        <Heading size="md" isTruncated>
          {getGoalName(goal)} ({humanReadableSats(getGoalAmount(goal) / 1000)})
        </Heading>

        <Spacer />

        <ButtonGroup>
          <GoalZapButton goal={goal} />
          <GoalMenu aria-label="More options" goal={goal} />
        </ButtonGroup>
      </Flex>
      <Flex gap="2" alignItems="center">
        <UserAvatar pubkey={goal.pubkey} size="sm" />
        <UserLink pubkey={goal.pubkey} fontWeight="bold" fontSize="lg" />
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
