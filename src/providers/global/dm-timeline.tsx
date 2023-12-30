import { PropsWithChildren, createContext, useCallback, useContext, useMemo } from "react";
import { Kind } from "nostr-tools";

import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useCurrentAccount from "../../hooks/use-current-account";
import TimelineLoader from "../../classes/timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { TORRENT_COMMENT_KIND } from "../../helpers/nostr/torrents";

type DMTimelineContextType = {
  timeline?: TimelineLoader;
};
const DMTimelineContext = createContext<DMTimelineContextType>({});

export function useDMTimeline() {
  const context = useContext(DMTimelineContext);

  if (!context?.timeline) throw new Error("No dm timeline");

  return context.timeline;
}

export default function DMTimelineProvider({ children }: PropsWithChildren) {
  const account = useCurrentAccount();
  const inbox = useReadRelayUrls();

  const userMuteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (userMuteFilter(event)) return false;
      return true;
    },
    [userMuteFilter],
  );

  const timeline = useTimelineLoader(
    `${account?.pubkey ?? "anon"}-dms`,
    inbox,
    account?.pubkey
      ? [
          { authors: [account.pubkey], kinds: [Kind.EncryptedDirectMessage] },
          { "#p": [account.pubkey], kinds: [Kind.EncryptedDirectMessage] },
        ]
      : undefined,
    { eventFilter },
  );

  const context = useMemo(() => ({ timeline }), [timeline]);

  return <DMTimelineContext.Provider value={context}>{children}</DMTimelineContext.Provider>;
}
