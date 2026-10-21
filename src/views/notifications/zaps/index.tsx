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
import { zapNotifications$ } from "../../../services/notifications";
import { TZapGroup } from "../../../helpers/nostr/zaps";
import MailboxSettingsButton from "../components/mailbox-settings-button";
import TimePeriodHeader from "../components/time-period-header";
import NotificationSyncLayout, { useLoadOlderOnScrollEnd } from "../components/notification-sync-layout";
import NotificationSyncStatus from "../components/notification-sync-status";
import ZapGroup from "./components/zap-group";

type ListItem = TimeGroupedListItem<TZapGroup>;
const EMPTY_ITEMS: TZapGroup[] = [];

function ListItemRow({ index, style, data }: ListChildComponentProps<ListItem[]>) {
  const item = data[index];
  return (
    <Box style={style}>
      {item.type === "header" ? (
        <TimePeriodHeader label={item.label} />
      ) : (
        <ErrorBoundary>
          <ZapGroup group={item.item} />
        </ErrorBoundary>
      )}
    </Box>
  );
}

export default function ZapsTab() {
  const scroll = useVirtualListScrollRestore("manual");
  const items = use$(zapNotifications$) ?? EMPTY_ITEMS;
  const sync = useNotificationSync("zaps");
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
      title="Zaps"
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
