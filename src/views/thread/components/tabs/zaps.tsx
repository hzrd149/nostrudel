import { Box, ButtonGroup, Flex, Text } from "@chakra-ui/react";
import { getZapPayment, getZapRequest, getZapSender } from "applesauce-core/helpers";
import { ThreadItem } from "applesauce-core/models";
import { NostrEvent } from "nostr-tools";
import { memo } from "react";

import { LightningIcon } from "../../../../components/icons";
import TextNoteContents from "../../../../components/note/timeline-note/text-note-contents";
import Timestamp from "../../../../components/timestamp";
import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserLink from "../../../../components/user/user-link";
import ZapReceiptMenu from "../../../../components/zap/zap-receipt-menu";
import { humanReadableSats } from "../../../../helpers/lightning";
import { ContentSettingsProvider } from "../../../../providers/local/content-settings";

const ZapEvent = memo(({ zap }: { zap: NostrEvent }) => {
  const request = getZapRequest(zap);
  const payment = getZapPayment(zap);
  const sender = getZapSender(zap);
  if (!payment?.amount) return null;

  return (
    <ContentSettingsProvider event={request}>
      <Flex gap="2">
        <Flex direction="column" alignItems="center" minW="10">
          <LightningIcon color="yellow.500" boxSize={5} />
          <Text>{humanReadableSats(payment.amount / 1000)}</Text>
        </Flex>

        <UserAvatarLink pubkey={sender} size="sm" ml="2" />
        <Box>
          <UserLink pubkey={sender} fontWeight="bold" />
          <Timestamp timestamp={zap.created_at} ml="2" />
          <TextNoteContents event={request} />
        </Box>

        <ButtonGroup ml="auto" size="sm" variant="ghost">
          <ZapReceiptMenu zap={zap} aria-label="More Options" />
        </ButtonGroup>
      </Flex>
    </ContentSettingsProvider>
  );
});

export default function PostZapsTab({ post, zaps }: { post: ThreadItem; zaps: NostrEvent[] }) {
  return (
    <Flex px="2" direction="column" gap="2" mb="2">
      {Array.from(zaps)
        .sort((a, b) => (getZapPayment(b)?.amount ?? 0) - (getZapPayment(a)?.amount ?? 0))
        .map((zap) => (
          <ZapEvent key={zap.id} zap={zap} />
        ))}
    </Flex>
  );
}
