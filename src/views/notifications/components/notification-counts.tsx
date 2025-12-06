import { useMemo } from "react";
import { useObservableEagerState } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";

import {
  mentionNotifications$,
  quoteNotifications$,
  replyNotifications$,
  repostNotifications$,
  threadNotifications$,
  zapNotifications$,
} from "../../../services/notifications";
import type { ThreadNotification } from "../threads/helpers";
import { getTimeRangeSince, TimeRange } from "./time-range-select";

export type NotificationCounts = {
  replies: number;
  threads: number;
  mentions: number;
  quotes: number;
  reposts: number;
  zaps: number;
};

export function useNotificationCounts(timeRange: TimeRange): NotificationCounts {
  const threads = useObservableEagerState(threadNotifications$) ?? [];
  const replies = useObservableEagerState(replyNotifications$) ?? [];
  const mentions = useObservableEagerState(mentionNotifications$) ?? [];
  const quotes = useObservableEagerState(quoteNotifications$) ?? [];
  const reposts = useObservableEagerState(repostNotifications$) ?? [];
  const zaps = useObservableEagerState(zapNotifications$) ?? [];

  const since = getTimeRangeSince(timeRange);

  return useMemo(() => {
    const filterThreads = (items: ThreadNotification[]): ThreadNotification[] => {
      if (!since) return items;
      return items.filter((item) => item.timestamp >= since);
    };

    const filterEvents = (items: NostrEvent[]): NostrEvent[] => {
      if (!since) return items;
      return items.filter((item) => item.created_at >= since);
    };

    const filterGroups = <T extends { latest: number }>(items: T[]): T[] => {
      if (!since) return items;
      return items.filter((item) => item.latest >= since);
    };

    return {
      replies: filterEvents(replies).length,
      threads: filterThreads(threads).length,
      mentions: filterEvents(mentions).length,
      quotes: filterEvents(quotes).length,
      reposts: filterGroups(reposts).length,
      zaps: filterGroups(zaps).length,
    };
  }, [replies, threads, mentions, quotes, reposts, zaps, since]);
}
