import { Box, Flex, FlexProps, Text } from "@chakra-ui/react";

import { getEventUID } from "../../../helpers/nostr/events";
import { getGoalRelays } from "../../../helpers/nostr/goal";
import useEventZaps from "../../../hooks/use-event-zaps";
import { NostrEvent } from "../../../types/nostr-event";
import UserAvatarLink from "../../../components/user-avatar-link";
import UserLink from "../../../components/user-link";
import { readablizeSats } from "../../../helpers/bolt11";
import { LightningIcon } from "../../../components/icons";

export default function GoalTopZappers({
  goal,
  max,
  ...props
}: Omit<FlexProps, "children"> & { goal: NostrEvent; max?: number }) {
  const zaps = useEventZaps(getEventUID(goal), getGoalRelays(goal), true);

  const totals: Record<string, number> = {};
  for (const zap of zaps) {
    const p = zap.request.pubkey;
    if (zap.payment.amount) {
      totals[p] = (totals[p] || 0) + zap.payment.amount;
    }
  }

  const sortedTotals = Array.from(Object.entries(totals)).sort((a, b) => b[1] - a[1]);
  if (max !== undefined) {
    sortedTotals.length = max;
  }

  return (
    <Flex gap="2" {...props}>
      {sortedTotals.map(([pubkey, amount]) => (
        <Flex key={pubkey} gap="2">
          <UserAvatarLink pubkey={pubkey} size="sm" />
          <Box whiteSpace="pre" isTruncated>
            <UserLink fontSize="lg" fontWeight="bold" pubkey={pubkey} mr="2" />
            <br />
            <LightningIcon /> {readablizeSats(amount / 1000)}
          </Box>
        </Flex>
      ))}
    </Flex>
  );
}
