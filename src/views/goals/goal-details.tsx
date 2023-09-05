import { useNavigate, useParams } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { Button, ButtonGroup, Divider, Flex, Heading, Spacer, Spinner } from "@chakra-ui/react";
import { ArrowLeftSIcon } from "../../components/icons";
import GoalMenu from "./components/goal-menu";
import { getGoalAmount, getGoalName } from "../../helpers/nostr/goal";
import GoalProgress from "./components/goal-progress";
import useSingleEvent from "../../hooks/use-single-event";
import { isHexKey } from "../../helpers/nip19";
import { EventPointer } from "nostr-tools/lib/nip19";
import { UserAvatar } from "../../components/user-avatar";
import { UserLink } from "../../components/user-link";
import GoalContents from "./components/goal-contents";
import GoalZapList from "./components/goal-zap-list";
import { readablizeSats } from "../../helpers/bolt11";
import GoalZapButton from "./components/goal-zap-button";

function useGoalPointerFromParams(): EventPointer {
  const { id } = useParams() as { id: string };
  if (isHexKey(id)) return { id };
  const parsed = nip19.decode(id);
  if (parsed.type === "nevent") return parsed.data;
  if (parsed.type === "note") return { id: parsed.data };
  throw new Error("bad goal id");
}

export default function GoalDetailsView() {
  const navigate = useNavigate();
  const pointer = useGoalPointerFromParams();

  const { event: goal } = useSingleEvent(pointer.id, pointer.relays);

  if (!goal) return <Spinner />;

  return (
    <Flex direction="column" px="2" pt="2" pb="8" overflow="hidden" h="full" gap="2">
      <Flex gap="2" alignItems="center">
        <Button onClick={() => navigate(-1)} leftIcon={<ArrowLeftSIcon />}>
          Back
        </Button>

        <Heading size="md" isTruncated>
          {getGoalName(goal)} ({readablizeSats(getGoalAmount(goal) / 1000)})
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
    </Flex>
  );
}
