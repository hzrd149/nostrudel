import { Box, Flex } from "@chakra-ui/react";
import { isValidZap, ZapEvent } from "applesauce-core/helpers";
import { TimelineModel } from "applesauce-core/models";
import { useActiveAccount, useEventModel, useObservableEagerState } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import { useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { VariableSizeList as List, ListChildComponentProps } from "react-window";

import { ErrorBoundary } from "../../../components/error-boundary";
import SimpleView from "../../../components/layout/presets/simple-view";
import { groupByTimePeriod, TimeGroupedListItem } from "../../../helpers/time-grouping";
import { groupZapsByZappedEvent, TZapGroup } from "../../../helpers/nostr/zaps";
import { useVirtualListScrollRestore } from "../../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import { zapNotificationsLoader$ } from "../../../services/notifications";
import TimePeriodHeader from "../components/time-period-header";
import ZapGroup from "./components/zap-group";

type ListItem = TimeGroupedListItem<TZapGroup>;

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
  const loader = useObservableEagerState(zapNotificationsLoader$);
  const callback = useTimelineCurserIntersectionCallback(loader ?? undefined);
  const scroll = useVirtualListScrollRestore("manual");

  // Get account
  const account = useActiveAccount()!;

  // Get timeline of zap events
  const events = useEventModel(TimelineModel, [{ kinds: [kinds.Zap], "#p": [account.pubkey] }])?.filter(
    (e): e is ZapEvent => {
      try {
        // Ensure the payment can be parsed
        return isValidZap(e);
      } catch (error) {
        return false;
      }
    },
  );

  // Group zaps by the zapped event
  const groups = useMemo(() => groupZapsByZappedEvent(events ?? []), [events]);

  // Group zap groups by time period and flatten into list items
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
      <SimpleView title="Zaps" scroll={false} flush gap={0}>
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
              No zaps yet
            </Box>
          )}
        </Flex>
      </SimpleView>
    </IntersectionObserverProvider>
  );
}
