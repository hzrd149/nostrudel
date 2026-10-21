import { Box, ButtonGroup } from "@chakra-ui/react";
import { COMMENT_KIND } from "applesauce-common/helpers";
import { useActiveAccount, use$ } from "applesauce-react/hooks";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { VariableSizeList as List, ListChildComponentProps } from "react-window";

import { ErrorBoundary } from "../../../components/error-boundary";
import SimpleView from "../../../components/layout/presets/simple-view";
import { groupByTimePeriod, TimeGroupedListItem } from "../../../helpers/time-grouping";
import { useVirtualListScrollRestore } from "../../../hooks/use-scroll-restore";
import useNotificationSync from "../../../hooks/use-notification-sync";
import { replyNotifications$ } from "../../../services/notifications";

import RelayDistributionButton from "../components/relay-distribution-button";
import MailboxSettingsButton from "../components/mailbox-settings-button";
import TimePeriodHeader from "../components/time-period-header";
import NotificationSyncLayout from "../components/notification-sync-layout";
import ReplyCard from "./components/reply-card";

type ListItem = TimeGroupedListItem<NostrEvent>;
const EMPTY_ITEMS: NostrEvent[] = [];

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
  const items = use$(replyNotifications$) ?? EMPTY_ITEMS;
  const sync = useNotificationSync("replies");
  const filter = useMemo<Filter>(
    () => ({ kinds: [kinds.ShortTextNote, COMMENT_KIND], "#p": [account.pubkey] }),
    [account.pubkey],
  );
  const listItems = useMemo<ListItem[]>(
    () =>
      groupByTimePeriod(
        items,
        (item) => item.created_at,
        (item) => item.id,
      ),
    [items],
  );
  const getItemSize = (index: number) => (listItems[index].type === "header" ? 60 : 80);

  return (
    <SimpleView
      title="Replies"
      scroll={false}
      flush
      gap={0}
      actions={
        <ButtonGroup ms="auto">
          <RelayDistributionButton filter={filter} title="Replies Notifications Relay Distribution" />
          <MailboxSettingsButton />
        </ButtonGroup>
      }
    >
      <NotificationSyncLayout state={sync} empty={listItems.length === 0}>
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
              ref={scroll.ref}
            >
              {ListItemRow}
            </List>
          )}
        </AutoSizer>
      </NotificationSyncLayout>
    </SimpleView>
  );
}
