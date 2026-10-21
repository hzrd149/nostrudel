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
import { mentionNotifications$ } from "../../../services/notifications";

import RelayDistributionButton from "../components/relay-distribution-button";
import MailboxSettingsButton from "../components/mailbox-settings-button";
import TimePeriodHeader from "../components/time-period-header";
import NotificationSyncLayout from "../components/notification-sync-layout";
import NotificationSyncStatus from "../components/notification-sync-status";
import MentionCard from "./components/mention-card";

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
          <MentionCard event={item.item} />
        </ErrorBoundary>
      )}
    </Box>
  );
}

export default function MentionsTab() {
  const scroll = useVirtualListScrollRestore("manual");
  const account = useActiveAccount()!;
  const items = use$(mentionNotifications$) ?? EMPTY_ITEMS;
  const sync = useNotificationSync("social");
  const filter = useMemo<Filter>(
    () => ({ kinds: [kinds.ShortTextNote, kinds.LongFormArticle, COMMENT_KIND], "#p": [account.pubkey] }),
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
      title="Mentions"
      scroll={false}
      flush
      gap={0}
      actions={
        <ButtonGroup ms="auto" alignItems="center">
          <NotificationSyncStatus states={[sync]} />
          <RelayDistributionButton filter={filter} title="Mentions Notifications Relay Distribution" />
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
