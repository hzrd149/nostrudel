import { Box, Flex, Spacer, Text } from "@chakra-ui/react";
import { getEventUID } from "../../../helpers/nostr/events";
import { getGoalRelays } from "../../../helpers/nostr/goal";
import useEventZaps from "../../../hooks/use-event-zaps";
import { NostrEvent } from "../../../types/nostr-event";
import { UserAvatarLink } from "../../../components/user-avatar-link";
import { UserLink } from "../../../components/user-link";
import { readablizeSats } from "../../../helpers/bolt11";
import { LightningIcon } from "../../../components/icons";
import dayjs from "dayjs";

export default function GoalZapList({ goal }: { goal: NostrEvent }) {
  const zaps = useEventZaps(getEventUID(goal), getGoalRelays(goal), true);
  const sorted = Array.from(zaps).sort((a, b) => b.event.created_at - a.event.created_at);

  return (
    <>
      {sorted.map((zap) => (
        <Flex key={zap.eventId} gap="2">
          <UserAvatarLink pubkey={zap.request.pubkey} size="md" />
          <Box>
            <Text>
              <UserLink fontSize="lg" fontWeight="bold" pubkey={zap.request.pubkey} mr="2" />
              <Text as="span">{dayjs.unix(zap.event.created_at).fromNow()}</Text>
            </Text>
            {zap.request.content && <Text>{zap.request.content}</Text>}
          </Box>
          <Spacer />
          {zap.payment.amount && (
            <Text>
              <LightningIcon /> {readablizeSats(zap.payment.amount / 1000)}
            </Text>
          )}
        </Flex>
      ))}
    </>
  );
}
