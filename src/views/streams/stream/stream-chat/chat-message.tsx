import { memo } from "react";
import { Box, Text } from "@chakra-ui/react";

import { ParsedStream } from "../../../../helpers/nostr/stream";
import UserAvatar from "../../../../components/user/user-avatar";
import UserLink from "../../../../components/user/user-link";
import { NostrEvent } from "../../../../types/nostr-event";
import { TrustProvider } from "../../../../providers/local/trust-provider";
import ChatMessageContent from "./chat-message-content";
import NoteZapButton from "../../../../components/note/note-zap-button";
import useEventIntersectionRef from "../../../../hooks/use-event-intersection-ref";

function ChatMessage({ event, stream }: { event: NostrEvent; stream: ParsedStream }) {
  const ref = useEventIntersectionRef(event);

  return (
    <TrustProvider event={event}>
      <Box>
        <Box overflow="hidden" maxH="lg" ref={ref}>
          <UserAvatar pubkey={event.pubkey} size="xs" display="inline-block" mr="2" />
          <Text as="span" fontWeight="bold" color={event.pubkey === stream.host ? "rgb(248, 56, 217)" : "cyan.500"}>
            <UserLink pubkey={event.pubkey} />
            {": "}
          </Text>
          <NoteZapButton
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
    </TrustProvider>
  );
}

const ChatMessageMemo = memo(ChatMessage);
export default ChatMessageMemo;
