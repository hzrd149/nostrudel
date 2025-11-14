import { Box, Flex } from "@chakra-ui/react";
import { COMMENT_KIND, insertEventIntoDescendingList } from "applesauce-core/helpers";
import { TimelineModel } from "applesauce-core/models";
import { useActiveAccount, useEventModel, useObservableEagerState } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { VariableSizeList as List, ListChildComponentProps } from "react-window";

import { ErrorBoundary } from "../../../components/error-boundary";
import SimpleView from "../../../components/layout/presets/simple-view";
import { groupByTimePeriod, TimeGroupedListItem } from "../../../helpers/time-grouping";
import { useVirtualListScrollRestore } from "../../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import { socialNotificationsLoader$ } from "../../../services/notifications";
import TimePeriodHeader from "../components/time-period-header";
import DirectReplyCard, { DirectReplyData } from "./components/direct-reply-card";
import ThreadGroup, { ThreadGroupData } from "./components/thread-group";
import { getReplyPointer, getThreadRoot, getThreadRootKey, isDirectReplyTo } from "./helpers";
import { eventStore } from "../../../services/event-store";

type ThreadNotification = { type: "direct"; data: DirectReplyData } | { type: "thread"; data: ThreadGroupData };

type ListItem = TimeGroupedListItem<ThreadNotification>;

function ListItemRow({ index, style, data }: ListChildComponentProps<ListItem[]>) {
  const item = data[index];

  return (
    <Box style={style}>
      {item.type === "header" ? (
        <TimePeriodHeader label={item.label} />
      ) : item.item.type === "direct" ? (
        <ErrorBoundary>
          <DirectReplyCard reply={item.item.data} />
        </ErrorBoundary>
      ) : (
        <ErrorBoundary>
          <ThreadGroup group={item.item.data} />
        </ErrorBoundary>
      )}
    </Box>
  );
}

export default function ThreadsTab() {
  const loader = useObservableEagerState(socialNotificationsLoader$);
  const callback = useTimelineCurserIntersectionCallback(loader ?? undefined);
  const scroll = useVirtualListScrollRestore("manual");

  // Get account
  const account = useActiveAccount()!;

  // Get timeline of social events (kind 1 and kind 1111)
  const events = useEventModel(TimelineModel, [{ kinds: [kinds.ShortTextNote, COMMENT_KIND], "#p": [account.pubkey] }]);

  // Categorize and group notifications
  const notifications = useMemo<ThreadNotification[]>(() => {
    if (!events || events.length === 0) return [];

    const directReplies: ThreadNotification[] = [];
    const threadGroups = new Map<string, ThreadGroupData>();

    for (const event of events) {
      // Skip user's own events
      if (event.pubkey === account.pubkey) continue;

      const replyPointer = getReplyPointer(event);
      const threadRoot = getThreadRoot(event);

      // Try to determine if this is a direct reply
      let isDirect = false;
      if (replyPointer) {
        // Check if reply pointer matches any of user's posts
        if ("id" in replyPointer) {
          const parentPost = eventStore.getEvent(replyPointer.id);
          isDirect = isDirectReplyTo(event, account.pubkey, parentPost);
        }
      }

      if (isDirect && replyPointer) {
        // Add as direct reply
        directReplies.push({
          type: "direct",
          data: {
            key: `direct-${event.id}`,
            event,
            parentPointer: replyPointer,
          },
        });
      } else if (threadRoot) {
        // Add to thread group
        const rootKey = getThreadRootKey(threadRoot);
        if (rootKey) {
          let group = threadGroups.get(rootKey);
          if (!group) {
            group = {
              key: rootKey,
              rootPointer: threadRoot,
              replies: [],
              repliers: [],
              latest: event.created_at,
            };
            threadGroups.set(rootKey, group);
          }

          // Add event to group
          insertEventIntoDescendingList(group.replies, event);

          // Add replier if not already in list
          if (!group.repliers.includes(event.pubkey)) {
            group.repliers.push(event.pubkey);
          }

          // Update latest timestamp
          group.latest = Math.max(group.latest, event.created_at);
        }
      }
    }

    // Convert thread groups to notifications
    const threadNotifications: ThreadNotification[] = Array.from(threadGroups.values()).map((group) => ({
      type: "thread" as const,
      data: group,
    }));

    // Combine and sort by timestamp
    const allNotifications = [...directReplies, ...threadNotifications];
    allNotifications.sort((a, b) => {
      const aTime = a.type === "direct" ? a.data.event.created_at : a.data.latest;
      const bTime = b.type === "direct" ? b.data.event.created_at : b.data.latest;
      return bTime - aTime;
    });

    return allNotifications;
  }, [events, account.pubkey]);

  // Group notifications by time period
  const listItems = useMemo<ListItem[]>(() => {
    return groupByTimePeriod(
      notifications,
      (notification) =>
        notification.type === "direct" ? notification.data.event.created_at : notification.data.latest,
      (notification) => (notification.type === "direct" ? notification.data.key : notification.data.key),
    );
  }, [notifications]);

  const getItemSize = (index: number) => {
    const item = listItems[index];
    return item.type === "header" ? 60 : 88;
  };

  return (
    <IntersectionObserverProvider callback={callback}>
      <SimpleView title="Threads" scroll={false} flush gap={0}>
        <Flex direction="column" flex={1}>
          {listItems.length > 0 ? (
            <AutoSizer>
              {({ height, width }) => (
                <List
                  itemKey={(index, data) => data[index].key}
                  itemCount={listItems.length}
                  itemSize={getItemSize}
                  itemData={listItems}
                  width={width}
                  height={height}
                  outerRef={scroll.outerRef}
                  ref={scroll.ref as any}
                >
                  {ListItemRow}
                </List>
              )}
            </AutoSizer>
          ) : (
            <Box mt="4" textAlign="center">
              No thread notifications yet
            </Box>
          )}
        </Flex>
      </SimpleView>
    </IntersectionObserverProvider>
  );
}
