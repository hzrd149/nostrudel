import { useCallback, useMemo } from "react";
import { kinds } from "nostr-tools";

import { getEventUID } from "../../../../helpers/nostr/events";
import { ParsedStream, STREAM_CHAT_MESSAGE_KIND, getATag } from "../../../../helpers/nostr/stream";
import useTimelineLoader from "../../../../hooks/use-timeline-loader";
import { NostrEvent } from "../../../../types/nostr-event";
import useStreamGoal from "../../../../hooks/use-stream-goal";
import { NostrQuery } from "../../../../types/nostr-query";
import useUserMuteFilter from "../../../../hooks/use-user-mute-filter";
import useClientSideMuteFilter from "../../../../hooks/use-client-side-mute-filter";
import { useReadRelays } from "../../../../hooks/use-client-relays";
import { useAdditionalRelayContext } from "../../../../providers/local/additional-relay-context";

export default function useStreamChatTimeline(stream: ParsedStream) {
  const streamRelays = useReadRelays(useAdditionalRelayContext());

  const hostMuteFilter = useUserMuteFilter(stream.host, [], { alwaysRequest: true });
  const muteFilter = useClientSideMuteFilter();

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (stream.starts && event.created_at < stream.starts) return false;
      if (stream.ends && event.created_at > stream.ends) return false;
      return !(hostMuteFilter(event) || muteFilter(event));
    },
    [stream, hostMuteFilter, muteFilter],
  );

  const goal = useStreamGoal(stream);
  const query = useMemo(() => {
    const streamQuery: NostrQuery = {
      "#a": [getATag(stream)],
      kinds: [STREAM_CHAT_MESSAGE_KIND, kinds.Zap],
    };

    if (goal) {
      return [
        streamQuery,
        // also get zaps to goal
        { "#e": [goal.id], kinds: [kinds.Zap] },
      ];
    }
    return streamQuery;
  }, [stream, goal]);

  return useTimelineLoader(`${getEventUID(stream.event)}-chat`, streamRelays, query, { eventFilter });
}
