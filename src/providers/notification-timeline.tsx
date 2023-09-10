import { PropsWithChildren, createContext, useContext, useEffect, useMemo } from "react";
import { Kind } from "nostr-tools";

import { useReadRelayUrls } from "../hooks/use-client-relays";
import { useCurrentAccount } from "../hooks/use-current-account";
import { TimelineLoader } from "../classes/timeline-loader";
import timelineCacheService from "../services/timeline-cache";

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

  const timeline = useMemo(() => {
    return account?.pubkey
      ? timelineCacheService.createTimeline(`${account?.pubkey ?? "anon"}-notification`)
      : undefined;
  }, [account?.pubkey]);

  useEffect(() => {
    if (timeline && account?.pubkey) {
      timeline.setQuery([{ "#p": [account?.pubkey], kinds: [Kind.Text, Kind.Repost, Kind.Reaction, Kind.Zap] }]);
    }
  }, [account?.pubkey, timeline]);

  useEffect(() => {
    timeline?.setRelays(readRelays);
  }, [readRelays.join("|")]);

  useEffect(() => {
    timeline?.open();
    return () => timeline?.close();
  }, [timeline]);

  const context = useMemo(() => ({ timeline }), [timeline]);

  return <NotificationTimelineContext.Provider value={context}>{children}</NotificationTimelineContext.Provider>;
}
