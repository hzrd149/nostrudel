import { memo } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";

import { ParsedStream } from "../../../../helpers/nostr/stream";
import UserAvatar from "../../../../components/user/user-avatar";
import UserLink from "../../../../components/user/user-link";
import { NostrEvent } from "../../../../types/nostr-event";
import { LightningIcon } from "../../../../components/icons";
import { humanReadableSats } from "../../../../helpers/lightning";
import { TrustProvider } from "../../../../providers/local/trust-provider";
import ChatMessageContent from "./chat-message-content";
import useClientSideMuteFilter from "../../../../hooks/use-client-side-mute-filter";
import useEventIntersectionRef from "../../../../hooks/use-event-intersection-ref";
import { getZapPayment, getZapRequest, getZapSender } from "applesauce-core/helpers";

function ZapMessage({ zap, stream }: { zap: NostrEvent; stream: ParsedStream }) {
  const ref = useEventIntersectionRef(zap);

  const sender = getZapSender(zap);
  const payment = getZapPayment(zap);
  const request = getZapRequest(zap);
  const clientMuteFilter = useClientSideMuteFilter();

  if (!payment?.amount) return null;
  if (clientMuteFilter(zap)) return null;

  return (
    <TrustProvider event={request}>
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
    </TrustProvider>
  );
}

const ZapMessageMemo = memo(ZapMessage);
export default ZapMessageMemo;
