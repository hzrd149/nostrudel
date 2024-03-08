import React, { useMemo, useRef } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";

import { ParsedStream } from "../../../../helpers/nostr/stream";
import UserAvatar from "../../../../components/user/user-avatar";
import UserLink from "../../../../components/user/user-link";
import { NostrEvent } from "../../../../types/nostr-event";
import { useRegisterIntersectionEntity } from "../../../../providers/local/intersection-observer";
import { LightningIcon } from "../../../../components/icons";
import { parseZapEvent } from "../../../../helpers/nostr/zaps";
import { readablizeSats } from "../../../../helpers/bolt11";
import { TrustProvider } from "../../../../providers/local/trust";
import ChatMessageContent from "./chat-message-content";
import useClientSideMuteFilter from "../../../../hooks/use-client-side-mute-filter";

function ZapMessage({ zap, stream }: { zap: NostrEvent; stream: ParsedStream }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, zap.id);

  const parsed = useMemo(() => {
    try {
      return parseZapEvent(zap);
    } catch (e) {}
  }, [zap]);
  const clientMuteFilter = useClientSideMuteFilter();

  if (!parsed || !parsed.payment.amount) return null;
  if (clientMuteFilter(parsed.event)) return null;

  return (
    <TrustProvider event={parsed.request}>
      <Flex direction="column" borderRadius="md" borderColor="yellow.400" borderWidth="1px" p="2" ref={ref}>
        <Flex gap="2">
          <LightningIcon color="yellow.400" />
          <UserAvatar pubkey={parsed.request.pubkey} size="xs" />
          <UserLink pubkey={parsed.request.pubkey} fontWeight="bold" color="yellow.400" />
          <Text>zapped {readablizeSats(parsed.payment.amount / 1000)} sats</Text>
        </Flex>
        <Box>
          <ChatMessageContent event={parsed.request} />
        </Box>
      </Flex>
    </TrustProvider>
  );
}

const ZapMessageMemo = React.memo(ZapMessage);
export default ZapMessageMemo;
