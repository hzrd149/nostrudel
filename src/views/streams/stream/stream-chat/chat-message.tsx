import { Box, Text } from "@chakra-ui/react";
import { castEvent, Stream } from "applesauce-common/casts";
import { NostrEvent } from "nostr-tools";
import { memo } from "react";

import UserAvatar from "../../../../components/user/user-avatar";
import UserLink from "../../../../components/user/user-link";
import EventZapButton from "../../../../components/zap/event-zap-button";
import useEventIntersectionRef from "../../../../hooks/use-event-intersection-ref";
import { ContentSettingsProvider } from "../../../../providers/local/content-settings";
import { eventStore } from "../../../../services/event-store";
import ChatMessageContent from "./chat-message-content";

function ChatMessage({ event, stream }: { event: NostrEvent; stream: NostrEvent }) {
  const ref = useEventIntersectionRef(event);
  const host = castEvent(stream, Stream, eventStore).host.pubkey;

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
