import { Box, ButtonGroup, Flex } from "@chakra-ui/react";
import { COMMENT_KIND } from "applesauce-core/helpers";
import { useActiveAccount, useObservableEagerState } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import { useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { VariableSizeList as List, ListChildComponentProps } from "react-window";

import { ErrorBoundary } from "../../../components/error-boundary";
import SimpleView from "../../../components/layout/presets/simple-view";
import { groupByTimePeriod, TimeGroupedListItem } from "../../../helpers/time-grouping";
import { useVirtualListScrollRestore } from "../../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import { socialNotificationsLoader$, threadNotifications$ } from "../../../services/notifications";
import RelayDistributionButton from "../components/relay-distribution-button";
import MailboxSettingsButton from "../components/mailbox-settings-button";
import TimePeriodHeader from "../components/time-period-header";
import DirectReplyCard from "./components/direct-reply-card";
import ThreadGroup from "./components/thread-group";
import { ThreadNotification } from "./helpers";

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
  const scroll = useVirtualListScrollRestore("manual");
  const account = useActiveAccount()!;

  // Start the event loader
  const loader = useObservableEagerState(socialNotificationsLoader$);
  const callback = useTimelineCurserIntersectionCallback(loader ?? undefined);

  // Subscribe to the processed thread notifications observable
  const notifications = useObservableEagerState(threadNotifications$) ?? [];

  // Filter for fetching events in the modal
  const filter = useMemo(
    () => ({
      kinds: [kinds.ShortTextNote, COMMENT_KIND],
      "#p": [account.pubkey],
    }),
    [account.pubkey],
  );

  // Group notifications by time period
  const listItems = useMemo<ListItem[]>(() => {
    return groupByTimePeriod(
      notifications,
      (notification) => notification.timestamp,
      (notification) => notification.data.key,
    );
  }, [notifications]);

  const getItemSize = (index: number) => {
    const item = listItems[index];
    return item.type === "header" ? 60 : 80;
  };

  return (
    <IntersectionObserverProvider callback={callback}>
      <SimpleView
        title="Threads"
        scroll={false}
        flush
        gap={0}
        actions={
          <ButtonGroup ms="auto">
            <RelayDistributionButton filter={filter} title="Thread Notifications Relay Distribution" />
            <MailboxSettingsButton />
          </ButtonGroup>
        }
      >
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
