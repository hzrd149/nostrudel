import { Box, ButtonGroup, Flex, Text } from "@chakra-ui/react";
import { Zap } from "applesauce-common/casts";
import { KnownEvent } from "applesauce-core/helpers";
import { getZapPayment, isValidZap } from "applesauce-common/helpers";
import { ThreadItem } from "applesauce-common/models";
import { kinds, NostrEvent } from "nostr-tools";
import { memo } from "react";

import { LightningIcon } from "../../../../components/icons";
import TextNoteContents from "../../../../components/timeline/note/text-note-contents";
import Timestamp from "../../../../components/timestamp";
import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserLink from "../../../../components/user/user-link";
import ZapReceiptMenu from "../../../../components/zap/zap-receipt-menu";
import { humanReadableSats } from "../../../../helpers/lightning";
import useCastEvent from "../../../../hooks/use-cast-event";
import { ContentSettingsProvider } from "../../../../providers/local/content-settings";

const ZapEvent = memo(({ zap }: { zap: KnownEvent<kinds.Zap> }) => {
  const cast = useCastEvent(zap, Zap);
  if (!cast?.amount) return null;

  return (
    <ContentSettingsProvider event={cast.request}>
      <Flex gap="2">
        <Flex direction="column" alignItems="center" minW="10">
          <LightningIcon color="yellow.500" boxSize={5} />
          <Text>{humanReadableSats(cast.amount / 1000)}</Text>
        </Flex>

        <UserAvatarLink pubkey={cast.sender.pubkey} size="sm" ml="2" />
        <Box>
          <UserLink pubkey={cast.sender.pubkey} fontWeight="bold" />
          <Timestamp timestamp={zap.created_at} ml="2" />
          <TextNoteContents event={cast.request} />
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
        .filter(isValidZap)
        .map((zap) => (
          <ZapEvent key={zap.id} zap={zap} />
        ))}
    </Flex>
  );
}
