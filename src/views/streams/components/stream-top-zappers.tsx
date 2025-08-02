import { Flex, FlexProps, Text } from "@chakra-ui/react";
import { kinds, NostrEvent } from "nostr-tools";
import { getZapPayment, getZapSender } from "applesauce-core/helpers";

import UserLink from "../../../components/user/user-link";
import { LightningIcon } from "../../../components/icons";
import { humanReadableSats } from "../../../helpers/lightning";
import useStreamChatTimeline from "../stream/stream-chat/use-stream-chat-timeline";
import UserAvatarLink from "../../../components/user/user-avatar-link";

export default function StreamTopZappers({ stream, ...props }: FlexProps & { stream: NostrEvent }) {
  const { timeline } = useStreamChatTimeline(stream);
  const zaps = timeline.filter((e) => e.kind === kinds.Zap);

  const totals = zaps?.reduce<Record<string, number>>((dir, z) => {
    try {
      const sender = getZapSender(z);
      dir[sender] = (dir[sender] ?? 0) + (getZapPayment(z)?.amount ?? 0);
    } catch (error) {}
    return dir;
  }, {});

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
            {humanReadableSats(total / 1000)}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
}
