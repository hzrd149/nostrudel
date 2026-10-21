import { Box, Flex, Text } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { memo } from "react";

import { Zap } from "applesauce-common/casts";
import { KnownEvent } from "applesauce-core/helpers";
import { LightningIcon } from "../../../../components/icons";
import ValueDisplay from "../../../../components/value-display";
import UserAvatar from "../../../../components/user/user-avatar";
import UserLink from "../../../../components/user/user-link";
import useCastEvent from "../../../../hooks/use-cast-event";
import useClientSideMuteFilter from "../../../../hooks/use-client-side-mute-filter";
import useEventIntersectionRef from "../../../../hooks/use-event-intersection-ref";
import { ContentSettingsProvider } from "../../../../providers/local/content-settings";
import ChatMessageContent from "./chat-message-content";

function ZapMessage({ zap }: { zap: KnownEvent<kinds.Zap> }) {
  const ref = useEventIntersectionRef(zap);

  const cast = useCastEvent(zap, Zap);
  const clientMuteFilter = useClientSideMuteFilter();

  if (!cast?.amount) return null;
  if (clientMuteFilter(zap)) return null;

  return (
    <ContentSettingsProvider event={cast.request}>
      <Flex direction="column" borderRadius="md" borderColor="yellow.400" borderWidth="1px" p="2" ref={ref}>
        <Flex gap="2">
          <LightningIcon color="yellow.400" />
          <UserAvatar pubkey={cast.sender.pubkey} size="xs" />
          <UserLink pubkey={cast.sender.pubkey} fontWeight="bold" color="yellow.400" />
          <Text>
            zapped <ValueDisplay sats={cast.amount / 1000} />
          </Text>
        </Flex>
        <Box>
          <ChatMessageContent event={cast.request} />
        </Box>
      </Flex>
    </ContentSettingsProvider>
  );
}

const ZapMessageMemo = memo(ZapMessage);
export default ZapMessageMemo;
