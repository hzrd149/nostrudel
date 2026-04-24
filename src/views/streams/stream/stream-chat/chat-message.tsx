import { memo } from "react";
import { Box, Text, Tooltip } from "@chakra-ui/react";
import { StreamChatMessage } from "applesauce-common/casts";
import { NostrEvent } from "nostr-tools";

import UserAvatar from "../../../../components/user/user-avatar";
import UserLink from "../../../../components/user/user-link";
import EventZapButton from "../../../../components/zap/event-zap-button";
import { getStreamHost } from "../../../../helpers/nostr/stream";
import useCastEvent from "../../../../hooks/use-cast-event";
import useEventIntersectionRef from "../../../../hooks/use-event-intersection-ref";
import { ContentSettingsProvider } from "../../../../providers/local/content-settings";
import ChatMessageContent from "./chat-message-content";

function ChatMessage({ event, stream, relays }: { event: NostrEvent; stream: NostrEvent; relays?: string[] }) {
  const ref = useEventIntersectionRef(event);
  const cast = useCastEvent(event, StreamChatMessage);
  const host = getStreamHost(stream);

  const seenCount = cast?.seen?.size ?? 0;
  const totalRelays = relays?.length ?? 0;
  const seenTitle = relays ? `Seen on ${seenCount}/${totalRelays} chat relays` : undefined;

  return (
    <ContentSettingsProvider event={event}>
      <Box>
        <Box overflow="hidden" maxH="lg" ref={ref}>
          <UserAvatar pubkey={event.pubkey} size="xs" display="inline-block" mr="2" />
          <Tooltip label={seenTitle} openDelay={400} isDisabled={!seenTitle}>
            <Text as="span" fontWeight="bold" color={event.pubkey === host ? "rgb(248, 56, 217)" : "cyan.500"}>
              <UserLink pubkey={event.pubkey} />
              {": "}
            </Text>
          </Tooltip>
          <EventZapButton
            display="inline-block"
            event={event}
            size="xs"
            variant="ghost"
            float="right"
            ml="2"
            allowComment={false}
          />
          <ChatMessageContent event={event} />
        </Box>
      </Box>
    </ContentSettingsProvider>
  );
}

const ChatMessageMemo = memo(ChatMessage);
export default ChatMessageMemo;
