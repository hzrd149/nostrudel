import React, { useRef } from "react";
import { Box, Text } from "@chakra-ui/react";

import { ParsedStream } from "../../../../helpers/nostr/stream";
import UserAvatar from "../../../../components/user-avatar";
import UserLink from "../../../../components/user-link";
import { NostrEvent } from "../../../../types/nostr-event";
import { useRegisterIntersectionEntity } from "../../../../providers/intersection-observer";
import { TrustProvider } from "../../../../providers/trust";
import ChatMessageContent from "./chat-message-content";
import NoteZapButton from "../../../../components/note/note-zap-button";

function ChatMessage({ event, stream }: { event: NostrEvent; stream: ParsedStream }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, event.id);

  return (
    <TrustProvider event={event}>
      <Box>
        <Box overflow="hidden" maxH="lg" ref={ref}>
          <UserAvatar pubkey={event.pubkey} size="xs" display="inline-block" mr="2" />
          <Text as="span" fontWeight="bold" color={event.pubkey === stream.host ? "rgb(248, 56, 217)" : "cyan"}>
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

const ChatMessageMemo = React.memo(ChatMessage);
export default ChatMessageMemo;
