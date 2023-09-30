import { memo } from "react";
import { Flex } from "@chakra-ui/react";
import { Kind } from "nostr-tools";

import useSubject from "../../../hooks/use-subject";
import useStreamChatTimeline from "../../streams/stream/stream-chat/use-stream-chat-timeline";
import { DashboardCardProps } from "./common";
import ZapMessageMemo from "../../streams/stream/stream-chat/zap-message";

function ZapsCard({ stream, ...props }: DashboardCardProps) {
  const streamChatTimeline = useStreamChatTimeline(stream);

  // refresh when a new event
  useSubject(streamChatTimeline.events.onEvent);
  const zapMessages = streamChatTimeline.events.getSortedEvents().filter((event) => event.kind === Kind.Zap);

  return (
    <Flex flex={1} p="2" gap="2" overflowY="auto" overflowX="hidden" flexDirection="column">
      {zapMessages.map((event) => (
        <ZapMessageMemo key={event.id} zap={event} stream={stream} />
      ))}
    </Flex>
  );
}

export default memo(ZapsCard);
