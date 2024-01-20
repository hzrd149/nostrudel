import { PropsWithChildren, createContext, useCallback, useContext, useMemo } from "react";
import { kinds } from "nostr-tools";

import { useReadRelays } from "../../hooks/use-client-relays";
import useCurrentAccount from "../../hooks/use-current-account";
import TimelineLoader from "../../classes/timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { TORRENT_COMMENT_KIND } from "../../helpers/nostr/torrents";

type NotificationTimelineContextType = {
  timeline?: TimelineLoader;
};
const NotificationTimelineContext = createContext<NotificationTimelineContextType>({});

export function useNotificationTimeline() {
  const context = useContext(NotificationTimelineContext);

  if (!context?.timeline) throw new Error("No notification timeline");

  return context.timeline;
}

export default function NotificationTimelineProvider({ children }: PropsWithChildren) {
  const account = useCurrentAccount();
  const inbox = useReadRelays();

  const userMuteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (userMuteFilter(event)) return false;
      return true;
    },
    [userMuteFilter],
  );

  const timeline = useTimelineLoader(
    `${account?.pubkey ?? "anon"}-notification`,
    inbox,
    account?.pubkey
      ? {
          "#p": [account.pubkey],
          kinds: [
            kinds.ShortTextNote,
            kinds.Repost,
            kinds.GenericRepost,
            kinds.Reaction,
            kinds.Zap,
            TORRENT_COMMENT_KIND,
            kinds.LongFormArticle,
          ],
        }
      : undefined,
    { eventFilter },
  );

  const context = useMemo(() => ({ timeline }), [timeline]);

  return <NotificationTimelineContext.Provider value={context}>{children}</NotificationTimelineContext.Provider>;
}
