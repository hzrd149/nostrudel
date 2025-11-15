import { Box, ButtonGroup, Flex } from "@chakra-ui/react";
import { useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { VariableSizeList as List, ListChildComponentProps } from "react-window";

import { useActiveAccount, useObservableEagerState } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import { ErrorBoundary } from "../../../components/error-boundary";
import SimpleView from "../../../components/layout/presets/simple-view";
import { groupByTimePeriod, TimeGroupedListItem } from "../../../helpers/time-grouping";
import { useVirtualListScrollRestore } from "../../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import { repostNotifications$, shareNotificationsLoader$, TRepostGroup } from "../../../services/notifications";
import RelayDistributionButton from "../components/relay-distribution-button";
import MailboxSettingsButton from "../components/mailbox-settings-button";
import TimePeriodHeader from "../components/time-period-header";
import RepostGroup from "./components/repost-group";

type ListItem = TimeGroupedListItem<TRepostGroup>;

function ListItemRow({ index, style, data }: ListChildComponentProps<ListItem[]>) {
  const item = data[index];

  return (
    <Box style={style}>
      {item.type === "header" ? (
        <TimePeriodHeader label={item.label} />
      ) : (
        <ErrorBoundary>
          <RepostGroup group={item.item} />
        </ErrorBoundary>
      )}
    </Box>
  );
}

export default function SharesTab() {
  const loader = useObservableEagerState(shareNotificationsLoader$);
  const callback = useTimelineCurserIntersectionCallback(loader ?? undefined);
  const scroll = useVirtualListScrollRestore("manual");

  // Get account
  const account = useActiveAccount()!;

  // Filter for fetching events in the modal
  const filter = useMemo(
    () => ({
      kinds: [kinds.Repost, kinds.GenericRepost],
      "#p": [account.pubkey],
    }),
    [account.pubkey],
  );

  // Get grouped repost notifications from the observable stream
  const groups = useObservableEagerState(repostNotifications$);

  // Group repost groups by time period
  const listItems = useMemo<ListItem[]>(() => {
    return groupByTimePeriod(
      groups,
      (group) => group.latest,
      (group) => group.key,
    );
  }, [groups]);

  const getItemSize = (index: number) => {
    const item = listItems[index];
    return item.type === "header" ? 60 : 88;
  };

  return (
    <IntersectionObserverProvider callback={callback}>
      <SimpleView
        title="Reposts"
        scroll={false}
        flush
        gap={0}
        actions={
          <ButtonGroup ms="auto">
            <RelayDistributionButton filter={filter} title="Repost Notifications Relay Distribution" />
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
              No shares yet
            </Box>
          )}
        </Flex>
      </SimpleView>
    </IntersectionObserverProvider>
  );
}
