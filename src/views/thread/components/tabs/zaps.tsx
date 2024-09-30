import { memo } from "react";
import { Box, ButtonGroup, Flex, Text } from "@chakra-ui/react";
import { ThreadItem } from "applesauce-core/queries";

import { ParsedZap } from "../../../../helpers/nostr/zaps";
import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserLink from "../../../../components/user/user-link";
import Timestamp from "../../../../components/timestamp";
import { LightningIcon } from "../../../../components/icons";
import { readablizeSats } from "../../../../helpers/bolt11";
import TextNoteContents from "../../../../components/note/timeline-note/text-note-contents";
import { TrustProvider } from "../../../../providers/local/trust-provider";
import ZapReceiptMenu from "../../../../components/zap/zap-receipt-menu";

const ZapEvent = memo(({ zap }: { zap: ParsedZap }) => {
  if (!zap.payment.amount) return null;

  return (
    <TrustProvider event={zap.request}>
      <Flex gap="2">
        <Flex direction="column" alignItems="center" minW="10">
          <LightningIcon color="yellow.500" boxSize={5} />
          <Text>{readablizeSats(zap.payment.amount / 1000)}</Text>
        </Flex>

        <UserAvatarLink pubkey={zap.request.pubkey} size="sm" ml="2" />
        <Box>
          <UserLink pubkey={zap.request.pubkey} fontWeight="bold" />
          <Timestamp timestamp={zap.event.created_at} ml="2" />
          <TextNoteContents event={zap.request} />
        </Box>

        <ButtonGroup ml="auto" size="sm" variant="ghost">
          <ZapReceiptMenu zap={zap.event} aria-label="More Options" />
        </ButtonGroup>
      </Flex>
    </TrustProvider>
  );
});

export default function PostZapsTab({ post, zaps }: { post: ThreadItem; zaps: ParsedZap[] }) {
  return (
    <Flex px="2" direction="column" gap="2" mb="2">
      {Array.from(zaps)
        .sort((a, b) => (b.payment.amount ?? 0) - (a.payment.amount ?? 0))
        .map((zap) => (
          <ZapEvent key={zap.event.id} zap={zap} />
        ))}
    </Flex>
  );
}
