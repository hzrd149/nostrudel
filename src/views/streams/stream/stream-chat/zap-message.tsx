import { Box, Flex, Text } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { memo } from "react";

import { getZapPayment, getZapRequest, getZapSender, KnownEvent } from "applesauce-core/helpers";
import { LightningIcon } from "../../../../components/icons";
import UserAvatar from "../../../../components/user/user-avatar";
import UserLink from "../../../../components/user/user-link";
import { humanReadableSats } from "../../../../helpers/lightning";
import useClientSideMuteFilter from "../../../../hooks/use-client-side-mute-filter";
import useEventIntersectionRef from "../../../../hooks/use-event-intersection-ref";
import { ContentSettingsProvider } from "../../../../providers/local/content-settings";
import ChatMessageContent from "./chat-message-content";

function ZapMessage({ zap }: { zap: KnownEvent<kinds.Zap> }) {
  const ref = useEventIntersectionRef(zap);

  const sender = getZapSender(zap);
  const payment = getZapPayment(zap);
  const request = getZapRequest(zap);
  const clientMuteFilter = useClientSideMuteFilter();

  if (!payment?.amount) return null;
  if (clientMuteFilter(zap)) return null;

  return (
    <ContentSettingsProvider event={request}>
      <Flex direction="column" borderRadius="md" borderColor="yellow.400" borderWidth="1px" p="2" ref={ref}>
        <Flex gap="2">
          <LightningIcon color="yellow.400" />
          <UserAvatar pubkey={sender} size="xs" />
          <UserLink pubkey={sender} fontWeight="bold" color="yellow.400" />
          <Text>zapped {humanReadableSats(payment.amount / 1000)} sats</Text>
        </Flex>
        <Box>
          <ChatMessageContent event={request} />
        </Box>
      </Flex>
    </ContentSettingsProvider>
  );
}

const ZapMessageMemo = memo(ZapMessage);
export default ZapMessageMemo;
