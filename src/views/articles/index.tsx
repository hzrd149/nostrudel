import { Box, Divider, Flex } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { useCallback, useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

import { ErrorBoundary } from "../../components/error-boundary";
import SimpleView from "../../components/layout/presets/simple-view";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import { getArticleTitle } from "../../helpers/nostr/long-form";
import { useReadRelays } from "../../hooks/use-client-relays";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { useVirtualListScrollRestore } from "../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import ArticleCard from "./components/article-card";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";

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
  const relays = useReadRelays();
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

  const { filter, listId } = usePeopleListContext();
  const filters = useMemo<Filter[] | undefined>(() => {
    if (!filter) return undefined;
    return [{ authors: filter.authors, kinds: [kinds.LongFormArticle] }];
  }, [filter]);

  const { loader, timeline: articles } = useTimelineLoader(`${listId ?? "global"}-articles`, relays, filters, {
    eventFilter,
  });
  const callback = useTimelineCurserIntersectionCallback(loader);

  const rowHight = useBreakpointValue({ base: 400, lg: 250 }) || 250;

  return (
    <IntersectionObserverProvider callback={callback}>
      <SimpleView title="Articles" scroll={false} actions={<PeopleListSelection ms="auto" />} flush gap={0}>
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
