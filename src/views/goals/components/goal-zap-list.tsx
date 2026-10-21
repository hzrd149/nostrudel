import { Box, Flex, Spacer, Text } from "@chakra-ui/react";
import { Zap, ZapGoal } from "applesauce-common/casts";
import { use$ } from "applesauce-react/hooks";

import { LightningIcon } from "../../../components/icons";
import TextNoteContents from "../../../components/timeline/note/text-note-contents";
import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import ValueDisplay from "../../../components/value-display";
import useCastTimeline from "../../../hooks/use-cast-timeline";

function GoalZap({ zap }: { zap: Zap }) {
  if (!zap.amount) return null;

  return (
    <Flex gap="2">
      <UserAvatarLink pubkey={zap.sender.pubkey} size="md" />
      <Box>
        <Text>
          <UserLink fontSize="lg" fontWeight="bold" pubkey={zap.sender.pubkey} mr="2" />
          <Timestamp timestamp={zap.event.created_at} />
        </Text>
        {zap.request.content && <TextNoteContents event={zap.request} />}
      </Box>
      <Spacer />
      <Text>
        <LightningIcon /> <ValueDisplay sats={zap.amount / 1000} />
      </Text>
    </Flex>
  );
}

export default function GoalZapList({ goal }: { goal: ZapGoal }) {
  const zaps = useCastTimeline(use$(goal.zaps$), Zap);

  return (
    <>
      {zaps.map((zap) => (
        <GoalZap key={zap.id} zap={zap} />
      ))}
    </>
  );
}
