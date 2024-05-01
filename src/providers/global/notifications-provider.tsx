import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { kinds } from "nostr-tools";

import { useReadRelays } from "../../hooks/use-client-relays";
import useCurrentAccount from "../../hooks/use-current-account";
import TimelineLoader from "../../classes/timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { TORRENT_COMMENT_KIND } from "../../helpers/nostr/torrents";
import { useUserInbox } from "../../hooks/use-user-mailboxes";
import AccountNotifications from "../../classes/notifications";
import { truncateId } from "../../helpers/string";

type NotificationTimelineContextType = {
  timeline: TimelineLoader;
  notifications?: AccountNotifications;
};
const NotificationTimelineContext = createContext<NotificationTimelineContextType | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationTimelineContext);
  if (!ctx) throw new Error("Missing notifications provider");
  return ctx;
}

export default function NotificationsProvider({ children }: PropsWithChildren) {
  const account = useCurrentAccount();
  const inbox = useUserInbox(account?.pubkey);
  const readRelays = useReadRelays(inbox);

  const [notifications, setNotifications] = useState<AccountNotifications>();

  const userMuteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (userMuteFilter(event)) return false;
      return true;
    },
    [userMuteFilter],
  );

  const timeline = useTimelineLoader(
    `${truncateId(account?.pubkey ?? "anon")}-notification`,
    readRelays,
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

  useEffect(() => {
    if (!account?.pubkey) return;
    const n = new AccountNotifications(account.pubkey, timeline.events);
    setNotifications(n);
    if (import.meta.env.DEV) {
      // @ts-expect-error
      window.accountNotifications = n;
    }

    return () => {
      n.destroy();
      setNotifications(undefined);
    };
  }, [account?.pubkey, timeline.events]);

  const context = useMemo(() => ({ timeline, notifications }), [timeline, notifications]);

  return <NotificationTimelineContext.Provider value={context}>{children}</NotificationTimelineContext.Provider>;
}
