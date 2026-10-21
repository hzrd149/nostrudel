import { Box, ButtonGroup } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { VariableSizeList as List, ListChildComponentProps } from "react-window";

import { ErrorBoundary } from "../../../components/error-boundary";
import SimpleView from "../../../components/layout/presets/simple-view";
import { groupByTimePeriod, TimeGroupedListItem } from "../../../helpers/time-grouping";
import { useVirtualListScrollRestore } from "../../../hooks/use-scroll-restore";
import useNotificationSync from "../../../hooks/use-notification-sync";
import { repostNotifications$ } from "../../../services/notifications";
import { TRepostGroup } from "../../../helpers/nostr/notification-groups";
import MailboxSettingsButton from "../components/mailbox-settings-button";
import TimePeriodHeader from "../components/time-period-header";
import NotificationSyncLayout, { useLoadOlderOnScrollEnd } from "../components/notification-sync-layout";
import NotificationSyncStatus from "../components/notification-sync-status";
import RepostGroup from "./components/repost-group";

type ListItem = TimeGroupedListItem<TRepostGroup>;
const EMPTY_ITEMS: TRepostGroup[] = [];

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
  const scroll = useVirtualListScrollRestore("manual");
  const items = use$(repostNotifications$) ?? EMPTY_ITEMS;
  const sync = useNotificationSync("reposts");
  const listItems = useMemo<ListItem[]>(
    () =>
      groupByTimePeriod(
        items,
        (item) => item.latest,
        (item) => item.key,
      ),
    [items],
  );
  const onItemsRendered = useLoadOlderOnScrollEnd(sync, listItems.length);
  const getItemSize = (index: number) => (listItems[index].type === "header" ? 60 : 88);

  return (
    <SimpleView
      title="Reposts"
      scroll={false}
      flush
      gap={0}
      actions={
        <ButtonGroup ms="auto" alignItems="center">
          <NotificationSyncStatus states={[sync]} />
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
              onItemsRendered={onItemsRendered}
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
