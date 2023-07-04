import { Box, Flex, FlexProps, Text } from "@chakra-ui/react";
import { ParsedZap } from "../../../../helpers/zaps";
import { UserAvatar } from "../../../../components/user-avatar";
import { UserLink } from "../../../../components/user-link";
import { LightningIcon } from "../../../../components/icons";
import { readablizeSats } from "../../../../helpers/bolt11";

export default function TopZappers({ zaps, ...props }: FlexProps & { zaps: ParsedZap[] }) {
  const totals: Record<string, number> = {};
  for (const zap of zaps) {
    const p = zap.request.pubkey;
    if (zap.payment.amount) {
      totals[p] = (totals[p] || 0) + zap.payment.amount;
    }
  }

  const sortedTotals = Array.from(Object.entries(totals)).sort((a, b) => b[1] - a[1]);

  return (
    <Flex overflowX="auto" overflowY="hidden" gap="4" py="2" px="4" {...props}>
      {sortedTotals.map(([pubkey, total]) => (
        <Flex key={pubkey} gap="2" alignItems="center" maxW="2xs">
          <UserAvatar pubkey={pubkey} size="sm" noProxy />
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
