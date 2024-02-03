import { memo } from "react";
import { Flex } from "@chakra-ui/react";
import { kinds } from "nostr-tools";

import useSubject from "../../../hooks/use-subject";
import useStreamChatTimeline from "../stream/stream-chat/use-stream-chat-timeline";
import ZapMessageMemo from "../stream/stream-chat/zap-message";
import { ParsedStream } from "../../../helpers/nostr/stream";

function ZapsCard({ stream }: { stream: ParsedStream }) {
  const streamChatTimeline = useStreamChatTimeline(stream);

  // refresh when a new event
  useSubject(streamChatTimeline.events.onEvent);
  const zapMessages = streamChatTimeline.events.getSortedEvents().filter((event) => {
    if (stream.starts && event.created_at < stream.starts) return false;
    if (stream.ends && event.created_at > stream.ends) return false;
    if (event.kind !== kinds.Zap) return false;
    return true;
  });

  return (
    <Flex flex={1} p="2" gap="2" overflowY="auto" overflowX="hidden" flexDirection="column">
      {zapMessages.map((event) => (
        <ZapMessageMemo key={event.id} zap={event} stream={stream} />
      ))}
    </Flex>
  );
}

export default memo(ZapsCard);
