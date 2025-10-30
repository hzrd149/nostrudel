import { Box, Divider, Flex } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";
import { useEventModel, useObservableEagerMemo } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { useCallback } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { map, of } from "rxjs";

import { ErrorBoundary } from "../../components/error-boundary";
import SimpleView from "../../components/layout/presets/simple-view";
import OutboxRelaySelectionModal from "../../components/outbox-relay-selection-modal";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import { getArticleTitle } from "../../helpers/nostr/long-form";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { useOutboxTimelineLoader } from "../../hooks/use-outbox-timeline-loader";
import { useVirtualListScrollRestore } from "../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { OutboxSelectionModel } from "../../models/outbox-selection";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import { eventStore } from "../../services/event-store";
import ArticleCard from "./components/article-card";

function ArticleRow({ index, style, data }: ListChildComponentProps<NostrEvent[]>) {
  return (
    <Box style={style}>
      <ErrorBoundary key={getEventUID(data[index])}>
        <ArticleCard article={data[index]} h="full" mx="auto" maxW="6xl" w="full" />
        <Divider mx="auto" maxW="6xl" w="full" />
      </ErrorBoundary>
    </Box>
  );
}

function ArticlesHomePage() {
  const userMuteFilter = useClientSideMuteFilter();
  const scroll = useVirtualListScrollRestore("manual");

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (userMuteFilter(event)) return false;
      if (!getArticleTitle(event)) return false;
      if (!event.content) return false;
      return true;
    },
    [userMuteFilter],
  );

  const { filter, pointer } = usePeopleListContext();
  const { outboxes, selection } = useEventModel(OutboxSelectionModel, pointer ? [pointer] : undefined) ?? {};

  // Get or create the outbox timeline loader
  const loader = useOutboxTimelineLoader(pointer, { kinds: [kinds.LongFormArticle] });

  // Subscribe to event store for timeline events
  const articles = useObservableEagerMemo(
    () =>
      filter
        ? eventStore
            .timeline({ ...filter, kinds: [kinds.LongFormArticle] })
            .pipe(map((events) => events.filter(eventFilter)))
        : of([]),
    [filter, eventFilter],
  );

  const callback = useTimelineCurserIntersectionCallback(loader);

  const rowHight = useBreakpointValue({ base: 400, lg: 250 }) || 250;

  return (
    <IntersectionObserverProvider callback={callback}>
      <SimpleView
        title="Articles"
        scroll={false}
        actions={
          <>
            <PeopleListSelection />
            {outboxes && selection && (
              <OutboxRelaySelectionModal outboxMap={outboxes} selection={selection} ms="auto" />
            )}
          </>
        }
        flush
        gap={0}
      >
        {/* Container */}
        <Flex direction="column" flex={1}>
          <AutoSizer>
            {({ height, width }) => (
              <List
                itemCount={articles.length}
                itemSize={rowHight}
                itemData={articles}
                width={width}
                height={height}
                {...scroll}
              >
                {ArticleRow}
              </List>
            )}
          </AutoSizer>
        </Flex>
      </SimpleView>
    </IntersectionObserverProvider>
  );
}

export default function ArticlesHomeView() {
  return (
    <PeopleListProvider>
      <ArticlesHomePage />
    </PeopleListProvider>
  );
}
