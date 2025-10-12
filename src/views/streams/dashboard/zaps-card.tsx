import { Flex } from "@chakra-ui/react";
import { isValidZap } from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { memo } from "react";

import { getStreamEndTime, getStreamStartTime } from "../../../helpers/nostr/stream";
import useStreamChatTimeline from "../stream/stream-chat/use-stream-chat-timeline";
import ZapMessageMemo from "../stream/stream-chat/zap-message";

function ZapsCard({ stream }: { stream: NostrEvent }) {
  const { timeline } = useStreamChatTimeline(stream);

  const starts = getStreamStartTime(stream);
  const ends = getStreamEndTime(stream);

  // refresh when a new event
  const zapMessages = timeline
    .filter((event) => {
      if (starts && event.created_at < starts) return false;
      if (ends && event.created_at > ends) return false;
      if (event.kind !== kinds.Zap) return false;
      return true;
    })
    .filter(isValidZap);

  return (
    <Flex flex={1} p="2" gap="2" overflowY="auto" overflowX="hidden" flexDirection="column">
      {zapMessages?.map((event) => (
        <ZapMessageMemo key={event.id} zap={event} />
      ))}
    </Flex>
  );
}

export default memo(ZapsCard);
