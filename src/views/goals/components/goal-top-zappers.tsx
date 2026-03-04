import { Box, Flex, FlexProps } from "@chakra-ui/react";
import { castEvent, Zap } from "applesauce-common/casts";

import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";
import { LightningIcon } from "../../../components/icons";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import { humanReadableSats } from "../../../helpers/lightning";
import { getGoalRelays } from "../../../helpers/nostr/goal";
import useEventZaps from "../../../hooks/use-event-zaps";
import { eventStore } from "../../../services/event-store";

export default function GoalTopZappers({
  goal,
  max,
  ...props
}: Omit<FlexProps, "children"> & { goal: NostrEvent; max?: number }) {
  const zaps = useEventZaps(goal, getGoalRelays(goal));

  const totals = useMemo(
    () =>
      zaps.reduce<Record<string, number>>((dir, zapEvent) => {
        const zap = castEvent(zapEvent, Zap, eventStore);
        if (!zap.amount) return dir;
        dir[zap.sender.pubkey] = (dir[zap.sender.pubkey] ?? 0) + zap.amount;
        return dir;
      }, {}),
    [zaps],
  );

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
