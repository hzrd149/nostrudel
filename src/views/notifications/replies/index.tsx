import { Box, ButtonGroup, Flex } from "@chakra-ui/react";
import { COMMENT_KIND } from "applesauce-core/helpers";
import { useActiveAccount, useObservableEagerState } from "applesauce-react/hooks";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { VariableSizeList as List, ListChildComponentProps } from "react-window";

import { ErrorBoundary } from "../../../components/error-boundary";
import SimpleView from "../../../components/layout/presets/simple-view";
import { groupByTimePeriod, TimeGroupedListItem } from "../../../helpers/time-grouping";
import { useVirtualListScrollRestore } from "../../../hooks/use-scroll-restore";
import { replyNotifications$ } from "../../../services/notifications";
import RelayDistributionButton from "../components/relay-distribution-button";
import MailboxSettingsButton from "../components/mailbox-settings-button";
import TimePeriodHeader from "../components/time-period-header";
import ReplyCard from "./components/reply-card";

type ListItem = TimeGroupedListItem<NostrEvent>;

function ListItemRow({ index, style, data }: ListChildComponentProps<ListItem[]>) {
  const item = data[index];

  return (
    <Box style={style}>
      {item.type === "header" ? (
        <TimePeriodHeader label={item.label} />
      ) : (
        <ErrorBoundary>
          <ReplyCard event={item.item} />
        </ErrorBoundary>
      )}
    </Box>
  );
}

export default function RepliesTab() {
  const scroll = useVirtualListScrollRestore("manual");
  const account = useActiveAccount()!;

  // Get reply notifications from the observable
  const replies = useObservableEagerState(replyNotifications$) ?? [];

  // Filter for fetching events in the modal
  const filter = useMemo<Filter>(
    () => ({
      kinds: [kinds.ShortTextNote, COMMENT_KIND],
      "#p": [account.pubkey],
    }),
    [account.pubkey],
  );

  // Group replies by time period
  const listItems = useMemo<ListItem[]>(() => {
    return groupByTimePeriod(
      replies,
      (event) => event.created_at,
      (event) => event.id,
    );
  }, [replies]);

  const getItemSize = (index: number) => {
    const item = listItems[index];
    return item.type === "header" ? 60 : 80;
  };

  return (
    <SimpleView
      title="Replies"
      scroll={false}
      flush
      gap={0}
      actions={
        <ButtonGroup ms="auto">
          <RelayDistributionButton filter={filter} title="Reply Notifications Relay Distribution" />
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
            No replies yet
          </Box>
        )}
      </Flex>
    </SimpleView>
  );
}
