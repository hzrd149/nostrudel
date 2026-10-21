import { useMemo } from "react";
import { use$ } from "applesauce-react/hooks";
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

const EMPTY_ITEMS: never[] = [];

export function useNotificationCounts(timeRange: TimeRange): NotificationCounts {
  const threads = use$(threadNotifications$) ?? EMPTY_ITEMS;
  const replies = use$(replyNotifications$) ?? EMPTY_ITEMS;
  const mentions = use$(mentionNotifications$) ?? EMPTY_ITEMS;
  const quotes = use$(quoteNotifications$) ?? EMPTY_ITEMS;
  const reposts = use$(repostNotifications$) ?? EMPTY_ITEMS;
  const zaps = use$(zapNotifications$) ?? EMPTY_ITEMS;

  const since = useMemo(() => getTimeRangeSince(timeRange), [timeRange]);

  return useMemo(() => {
    const filterThreads = (items: ThreadNotification[]): ThreadNotification[] => {
      return items.filter((item) => item.timestamp >= since);
    };

    const filterEvents = (items: NostrEvent[]): NostrEvent[] => {
      return items.filter((item) => item.created_at >= since);
    };

    const filterGroups = <T extends { latest: number }>(items: T[]): T[] => {
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
