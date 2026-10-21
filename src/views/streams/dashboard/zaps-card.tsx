import { Flex } from "@chakra-ui/react";
import { castEvent, Stream } from "applesauce-common/casts";
import { isValidZap } from "applesauce-common/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { memo } from "react";

import { eventStore } from "../../../services/event-store";
import useStreamChatTimeline from "../stream/stream-chat/use-stream-chat-timeline";
import ZapMessageMemo from "../stream/stream-chat/zap-message";

function ZapsCard({ stream }: { stream: NostrEvent }) {
  const { timeline } = useStreamChatTimeline(stream);

  const cast = castEvent(stream, Stream, eventStore);
  const starts = cast.startTime;
  const ends = cast.endTime;

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
