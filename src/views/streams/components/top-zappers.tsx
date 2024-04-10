import { useMemo } from "react";
import { Flex, FlexProps, Text } from "@chakra-ui/react";

import { parseZapEvents } from "../../../helpers/nostr/zaps";
import UserLink from "../../../components/user/user-link";
import { LightningIcon } from "../../../components/icons";
import { readablizeSats } from "../../../helpers/bolt11";
import useStreamChatTimeline from "../stream/stream-chat/use-stream-chat-timeline";
import { ParsedStream } from "../../../helpers/nostr/stream";
import useSubject from "../../../hooks/use-subject";
import UserAvatarLink from "../../../components/user/user-avatar-link";

export default function TopZappers({ stream, ...props }: FlexProps & { stream: ParsedStream }) {
  const timeline = useStreamChatTimeline(stream);
  const events = useSubject(timeline.timeline);
  const zaps = useMemo(() => parseZapEvents(events), [events]);

  const totals: Record<string, number> = {};
  for (const zap of zaps) {
    const p = zap.request.pubkey;
    if (zap.payment.amount) {
      totals[p] = (totals[p] || 0) + zap.payment.amount;
    }
  }

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
            {readablizeSats(total / 1000)}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
}
