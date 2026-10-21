import { Box, ButtonGroup, Flex } from "@chakra-ui/react";
import { Zap } from "applesauce-common/casts";
import { isValidZap } from "applesauce-common/helpers";
import { NostrEvent } from "nostr-tools";
import { memo } from "react";

import { LightningIcon } from "../../../../components/icons";
import TextNoteContents from "../../../../components/timeline/note/text-note-contents";
import Timestamp from "../../../../components/timestamp";
import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserLink from "../../../../components/user/user-link";
import ZapReceiptMenu from "../../../../components/zap/zap-receipt-menu";
import ValueDisplay from "../../../../components/value-display";
import useCastTimeline from "../../../../hooks/use-cast-timeline";
import { ContentSettingsProvider } from "../../../../providers/local/content-settings";

const ZapEvent = memo(({ zap }: { zap: Zap }) => {
  if (!zap.amount) return null;

  return (
    <ContentSettingsProvider event={zap.request}>
      <Flex gap="2">
        <Flex direction="column" alignItems="center" minW="10">
          <LightningIcon color="yellow.500" boxSize={5} />
          <ValueDisplay sats={zap.amount / 1000} />
        </Flex>

        <UserAvatarLink pubkey={zap.sender.pubkey} size="sm" ml="2" />
        <Box>
          <UserLink pubkey={zap.sender.pubkey} fontWeight="bold" />
          <Timestamp timestamp={zap.event.created_at} ml="2" />
          <TextNoteContents event={zap.request} />
        </Box>

        <ButtonGroup ml="auto" size="sm" variant="ghost">
          <ZapReceiptMenu zap={zap.event} aria-label="More Options" />
        </ButtonGroup>
      </Flex>
    </ContentSettingsProvider>
  );
});

export default function PostZapsTab({ zaps }: { zaps: NostrEvent[] }) {
  const casts = useCastTimeline(zaps.filter(isValidZap), Zap);

  return (
    <Flex px="2" direction="column" gap="2" mb="2">
      {[...casts]
        .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
        .map((zap) => (
          <ZapEvent key={zap.id} zap={zap} />
        ))}
    </Flex>
  );
}
