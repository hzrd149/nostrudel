import { useCallback, useMemo } from "react";
import { Kind } from "nostr-tools";

import { getEventUID } from "../../../../helpers/nostr/events";
import { ParsedStream, STREAM_CHAT_MESSAGE_KIND, getATag } from "../../../../helpers/nostr/stream";
import useTimelineLoader from "../../../../hooks/use-timeline-loader";
import { NostrEvent } from "../../../../types/nostr-event";
import { useRelaySelectionRelays } from "../../../../providers/local/relay-selection-provider";
import useStreamGoal from "../../../../hooks/use-stream-goal";
import { NostrQuery } from "../../../../types/nostr-query";
import useUserMuteFilter from "../../../../hooks/use-user-mute-filter";
import useClientSideMuteFilter from "../../../../hooks/use-client-side-mute-filter";

export default function useStreamChatTimeline(stream: ParsedStream) {
  const streamRelays = useRelaySelectionRelays();

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
      kinds: [STREAM_CHAT_MESSAGE_KIND, Kind.Zap],
    };

    if (goal) {
      return [
        streamQuery,
        // also get zaps to goal
        { "#e": [goal.id], kinds: [Kind.Zap] },
      ];
    }
    return streamQuery;
  }, [stream, goal]);

  return useTimelineLoader(`${getEventUID(stream.event)}-chat`, streamRelays, query, { eventFilter });
}
