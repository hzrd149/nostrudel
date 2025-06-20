import { memo } from "react";
import { Box, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import UserAvatar from "../../../../components/user/user-avatar";
import UserLink from "../../../../components/user/user-link";
import { ContentSettingsProvider } from "../../../../providers/local/content-settings";
import ChatMessageContent from "./chat-message-content";
import EventZapButton from "../../../../components/zap/event-zap-button";
import useEventIntersectionRef from "../../../../hooks/use-event-intersection-ref";
import { getStreamHost } from "../../../../helpers/nostr/stream";

function ChatMessage({ event, stream }: { event: NostrEvent; stream: NostrEvent }) {
  const ref = useEventIntersectionRef(event);
  const host = getStreamHost(stream);

  return (
    <ContentSettingsProvider event={event}>
      <Box>
        <Box overflow="hidden" maxH="lg" ref={ref}>
          <UserAvatar pubkey={event.pubkey} size="xs" display="inline-block" mr="2" />
          <Text as="span" fontWeight="bold" color={event.pubkey === host ? "rgb(248, 56, 217)" : "cyan.500"}>
            <UserLink pubkey={event.pubkey} />
            {": "}
          </Text>
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
