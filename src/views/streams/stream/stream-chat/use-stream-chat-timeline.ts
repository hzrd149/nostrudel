import { useCallback, useMemo } from "react";
import { Kind } from "nostr-tools";

import { getEventUID } from "../../../../helpers/nostr/events";
import { ParsedStream, STREAM_CHAT_MESSAGE_KIND, getATag } from "../../../../helpers/nostr/stream";
import useTimelineLoader from "../../../../hooks/use-timeline-loader";
import { NostrEvent, isPTag } from "../../../../types/nostr-event";
import useUserMuteList from "../../../../hooks/use-user-mute-list";
import { useRelaySelectionRelays } from "../../../../providers/relay-selection-provider";
import { useCurrentAccount } from "../../../../hooks/use-current-account";

export default function useStreamChatTimeline(stream: ParsedStream) {
  const account = useCurrentAccount();
  const streamRelays = useRelaySelectionRelays();

  const hostMuteList = useUserMuteList(stream.host);
  const muteList = useUserMuteList(account?.pubkey);
  const mutedPubkeys = useMemo(
    () => [...(hostMuteList?.tags ?? []), ...(muteList?.tags ?? [])].filter(isPTag).map((t) => t[1] as string),
    [hostMuteList, muteList],
  );

  const eventFilter = useCallback((event: NostrEvent) => !mutedPubkeys.includes(event.pubkey), [mutedPubkeys]);
  return useTimelineLoader(
    `${getEventUID(stream.event)}-chat`,
    streamRelays,
    {
      "#a": [getATag(stream)],
      kinds: [STREAM_CHAT_MESSAGE_KIND, Kind.Zap],
    },
    { eventFilter },
  );
}
