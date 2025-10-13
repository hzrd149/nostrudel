import { getEventUID, getStreamRelays } from "applesauce-core/helpers";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { useCallback, useMemo } from "react";

import { getEventCoordinate } from "../../../../helpers/nostr/event";
import { getStreamEndTime, getStreamHost, getStreamStartTime } from "../../../../helpers/nostr/stream";
import { useReadRelays } from "../../../../hooks/use-client-relays";
import useClientSideMuteFilter from "../../../../hooks/use-client-side-mute-filter";
import useStreamGoal from "../../../../hooks/use-stream-goal";
import useTimelineLoader from "../../../../hooks/use-timeline-loader";
import useUserMuteFilter from "../../../../hooks/use-user-mute-filter";

export default function useStreamChatTimeline(stream: NostrEvent) {
  const readRelays = useReadRelays(getStreamRelays(stream));

  const host = getStreamHost(stream);
  const starts = getStreamStartTime(stream);
  const ends = getStreamEndTime(stream);

  const hostMuteFilter = useUserMuteFilter(host);
  const muteFilter = useClientSideMuteFilter();

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (starts && event.created_at < starts) return false;
      if (ends && event.created_at > ends) return false;
      return !(hostMuteFilter(event) || muteFilter(event));
    },
    [stream, hostMuteFilter, muteFilter],
  );

  const goal = useStreamGoal(stream);
  const query = useMemo(() => {
    const streamQuery: Filter = {
      "#a": [getEventCoordinate(stream)],
      kinds: [kinds.LiveChatMessage, kinds.Zap],
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

  return useTimelineLoader(`${getEventUID(stream)}-chat`, readRelays, query, { eventFilter });
}
