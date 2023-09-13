import { useCallback, useMemo } from "react";
import { Kind } from "nostr-tools";

import { getEventUID } from "../../../../helpers/nostr/events";
import { ParsedStream, STREAM_CHAT_MESSAGE_KIND, getATag } from "../../../../helpers/nostr/stream";
import useTimelineLoader from "../../../../hooks/use-timeline-loader";
import { NostrEvent } from "../../../../types/nostr-event";
import { useRelaySelectionRelays } from "../../../../providers/relay-selection-provider";
import { useCurrentAccount } from "../../../../hooks/use-current-account";
import useStreamGoal from "../../../../hooks/use-stream-goal";
import { NostrQuery } from "../../../../types/nostr-query";
import useUserMuteFilter from "../../../../hooks/use-user-mute-filter";

export default function useStreamChatTimeline(stream: ParsedStream) {
  const account = useCurrentAccount();
  const streamRelays = useRelaySelectionRelays();

  const hostMuteFilter = useUserMuteFilter(stream.host);
  const userMuteFilter = useUserMuteFilter(account?.pubkey);

  const eventFilter = useCallback(
    (event: NostrEvent) => !(hostMuteFilter(event) || userMuteFilter(event)),
    [hostMuteFilter, userMuteFilter],
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
