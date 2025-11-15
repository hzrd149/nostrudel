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
import { mentionNotifications$ } from "../../../services/notifications";
import RelayDistributionButton from "../components/relay-distribution-button";
import MailboxSettingsButton from "../components/mailbox-settings-button";
import TimePeriodHeader from "../components/time-period-header";
import MentionCard from "./components/mention-card";

type ListItem = TimeGroupedListItem<NostrEvent>;

function ListItemRow({ index, style, data }: ListChildComponentProps<ListItem[]>) {
  const item = data[index];

  return (
    <Box style={style}>
      {item.type === "header" ? (
        <TimePeriodHeader label={item.label} />
      ) : (
        <ErrorBoundary>
          <MentionCard event={item.item} />
        </ErrorBoundary>
      )}
    </Box>
  );
}

export default function MentionsTab() {
  const scroll = useVirtualListScrollRestore("manual");
  const account = useActiveAccount()!;

  // Get mention notifications from the observable
  const mentions = useObservableEagerState(mentionNotifications$) ?? [];

  // Filter for fetching events in the modal
  const filter = useMemo<Filter>(
    () => ({
      kinds: [kinds.ShortTextNote, kinds.LongFormArticle, COMMENT_KIND],
      "#p": [account.pubkey],
    }),
    [account.pubkey],
  );

  // Group mentions by time period
  const listItems = useMemo<ListItem[]>(() => {
    return groupByTimePeriod(
      mentions,
      (event) => event.created_at,
      (event) => event.id,
    );
  }, [mentions]);

  const getItemSize = (index: number) => {
    const item = listItems[index];
    return item.type === "header" ? 60 : 80;
  };

  return (
    <SimpleView
      title="Mentions"
      scroll={false}
      flush
      gap={0}
      actions={
        <ButtonGroup ms="auto">
          <RelayDistributionButton filter={filter} title="Mention Notifications Relay Distribution" />
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
            No mentions yet
          </Box>
        )}
      </Flex>
    </SimpleView>
  );
}
