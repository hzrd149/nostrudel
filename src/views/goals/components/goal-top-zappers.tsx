import { Box, Flex, FlexProps } from "@chakra-ui/react";
import { getEventUID, getZapPayment, getZapSender } from "applesauce-core/helpers";

import { getGoalRelays } from "../../../helpers/nostr/goal";
import useEventZaps from "../../../hooks/use-event-zaps";
import { NostrEvent } from "../../../types/nostr-event";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import { humanReadableSats } from "../../../helpers/lightning";
import { LightningIcon } from "../../../components/icons";

export default function GoalTopZappers({
  goal,
  max,
  ...props
}: Omit<FlexProps, "children"> & { goal: NostrEvent; max?: number }) {
  const zaps = useEventZaps(getEventUID(goal), getGoalRelays(goal), true);

  const totals = zaps?.reduce<Record<string, number>>((dir, z) => {
    const sender = getZapSender(z);
    dir[sender] = (dir[sender] ?? 0) + (getZapPayment(z)?.amount ?? 0);
    return dir;
  }, {});

  const sortedTotals = totals ? Array.from(Object.entries(totals)).sort((a, b) => b[1] - a[1]) : [];
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
            <LightningIcon /> {humanReadableSats(amount / 1000)}
          </Box>
        </Flex>
      ))}
    </Flex>
  );
}
