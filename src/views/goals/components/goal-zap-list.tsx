import { Box, Flex, Spacer, Text } from "@chakra-ui/react";
import { getEventUID, getZapPayment, getZapRequest, getZapSender } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

import { getGoalRelays } from "../../../helpers/nostr/goal";
import useEventZaps from "../../../hooks/use-event-zaps";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import { humanReadableSats } from "../../../helpers/lightning";
import { LightningIcon } from "../../../components/icons";
import Timestamp from "../../../components/timestamp";
import TextNoteContents from "../../../components/note/timeline-note/text-note-contents";

function GoalZap({ zap }: { zap: NostrEvent }) {
  const request = getZapRequest(zap);
  const payment = getZapPayment(zap);
  const sender = getZapSender(zap);
  if (!payment?.amount) return null;

  return (
    <Flex gap="2">
      <UserAvatarLink pubkey={sender} size="md" />
      <Box>
        <Text>
          <UserLink fontSize="lg" fontWeight="bold" pubkey={sender} mr="2" />
          <Timestamp timestamp={zap.created_at} />
        </Text>
        {request.content && <TextNoteContents event={request} />}
      </Box>
      <Spacer />
      <Text>
        <LightningIcon /> {humanReadableSats(payment.amount / 1000)}
      </Text>
    </Flex>
  );
}

export default function GoalZapList({ goal }: { goal: NostrEvent }) {
  const zaps = useEventZaps(goal, getGoalRelays(goal));

  return (
    <>
      {zaps.map((zap) => (
        <GoalZap key={zap.id} zap={zap} />
      ))}
    </>
  );
}
