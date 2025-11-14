import { Box, Flex } from "@chakra-ui/react";
import { COMMENT_KIND } from "applesauce-core/helpers";
import { TimelineModel } from "applesauce-core/models";
import { useActiveAccount, useEventModel, useObservableEagerState } from "applesauce-react/hooks";
import { getContentPointers } from "applesauce-factory/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { VariableSizeList as List, ListChildComponentProps } from "react-window";

import { ErrorBoundary } from "../../../components/error-boundary";
import SimpleView from "../../../components/layout/presets/simple-view";
import { groupByTimePeriod, TimeGroupedListItem } from "../../../helpers/time-grouping";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import { useVirtualListScrollRestore } from "../../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import { socialNotificationsLoader$ } from "../../../services/notifications";
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
  const loader = useObservableEagerState(socialNotificationsLoader$);
  const callback = useTimelineCurserIntersectionCallback(loader ?? undefined);
  const scroll = useVirtualListScrollRestore("manual");

  // Get account
  const account = useActiveAccount()!;

  // Get timeline of social events
  const events = useEventModel(TimelineModel, [
    { kinds: [kinds.ShortTextNote, kinds.LongFormArticle, COMMENT_KIND], "#p": [account.pubkey] },
  ]);

  // Filter events to only show mentions
  const mentions = useMemo<NostrEvent[]>(() => {
    if (!events || events.length === 0) return [];

    return events
      .filter((event) => {
        // Check if the user's pubkey is mentioned in the content
        const pointers = getContentPointers(event.content);
        return pointers.some(
          (p) =>
            // npub mention
            (p.type === "npub" && p.data === account.pubkey) ||
            // nprofile mention
            (p.type === "nprofile" && p.data.pubkey === account.pubkey),
        );
      })
      .sort((a, b) => b.created_at - a.created_at);
  }, [events, account.pubkey]);

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
    <IntersectionObserverProvider callback={callback}>
      <SimpleView title="Mentions" scroll={false} flush gap={0}>
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
    </IntersectionObserverProvider>
  );
}
