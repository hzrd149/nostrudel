import { Flex, FlexProps, Text } from "@chakra-ui/react";
import { castEvent, Zap } from "applesauce-common/casts";
import { isValidZap } from "applesauce-common/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import { LightningIcon } from "../../../../components/icons";
import ValueDisplay from "../../../../components/value-display";
import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserLink from "../../../../components/user/user-link";
import { eventStore } from "../../../../services/event-store";
import useStreamChatTimeline from "../../stream/stream-chat/use-stream-chat-timeline";

export default function StreamTopZappers({ stream, ...props }: FlexProps & { stream: NostrEvent }) {
  const { timeline } = useStreamChatTimeline(stream);

  const totals = useMemo(
    () =>
      timeline
        .filter((e) => e.kind === kinds.Zap)
        .filter(isValidZap)
        .reduce<Record<string, number>>((dir, zapEvent) => {
          const zap = castEvent(zapEvent, Zap, eventStore);
          if (!zap.amount) return dir;
          dir[zap.sender.pubkey] = (dir[zap.sender.pubkey] ?? 0) + zap.amount;
          return dir;
        }, {}),
    [timeline],
  );

  const sortedTotals = Array.from(Object.entries(totals)).sort((a, b) => b[1] - a[1]);

  return (
    <Flex overflowX="auto" overflowY="hidden" gap="4" {...props}>
      {sortedTotals.map(([pubkey, total]) => (
        <Flex key={pubkey} gap="2" alignItems="center" maxW="2xs">
          <UserAvatarLink pubkey={pubkey} size="sm" noProxy />
          <Text whiteSpace="nowrap" isTruncated>
            <UserLink pubkey={pubkey} fontWeight="bold" />
            <br />
            <LightningIcon />
            <ValueDisplay sats={total / 1000} />
          </Text>
        </Flex>
      ))}
    </Flex>
  );
}
