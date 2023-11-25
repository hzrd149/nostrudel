import { PropsWithChildren, createContext, useCallback, useContext, useMemo } from "react";
import { Kind } from "nostr-tools";

import { useReadRelayUrls } from "../hooks/use-client-relays";
import useCurrentAccount from "../hooks/use-current-account";
import TimelineLoader from "../classes/timeline-loader";
import { NostrEvent } from "../types/nostr-event";
import useClientSideMuteFilter from "../hooks/use-client-side-mute-filter";
import useTimelineLoader from "../hooks/use-timeline-loader";

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
  const readRelays = useReadRelayUrls();

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
    readRelays,
    { "#p": [account?.pubkey ?? "0000"], kinds: [Kind.Text, Kind.Repost, Kind.Reaction, Kind.Zap] },
    { enabled: !!account?.pubkey, eventFilter },
  );

  const context = useMemo(() => ({ timeline }), [timeline]);

  return <NotificationTimelineContext.Provider value={context}>{children}</NotificationTimelineContext.Provider>;
}
