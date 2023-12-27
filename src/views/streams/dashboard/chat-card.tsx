import { memo, useRef } from "react";
import { Flex } from "@chakra-ui/react";

import useStreamChatTimeline from "../stream/stream-chat/use-stream-chat-timeline";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../../providers/intersection-observer";
import StreamChatLog from "../stream/stream-chat/chat-log";
import ChatMessageForm from "../stream/stream-chat/stream-chat-form";
import { ParsedStream } from "../../../helpers/nostr/stream";

function ChatCard({ stream }: { stream: ParsedStream }) {
  const timeline = useStreamChatTimeline(stream);

  const scrollBox = useRef<HTMLDivElement | null>(null);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <Flex flex={1} direction="column" overflow="hidden" p={0}>
      <IntersectionObserverProvider callback={callback} root={scrollBox}>
        <StreamChatLog ref={scrollBox} stream={stream} flex={1} px="4" py="2" mb="2" />
        <ChatMessageForm stream={stream} hideZapButton />
      </IntersectionObserverProvider>
    </Flex>
  );
}

export default memo(ChatCard);
