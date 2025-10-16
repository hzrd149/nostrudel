import { Box, Divider, Flex } from "@chakra-ui/react";
import { includeFallbackRelays, includeMailboxes } from "applesauce-core";
import { getEventUID, groupPubkeysByRelay, selectOptimalRelays } from "applesauce-core/helpers";
import { TimelessFilter } from "applesauce-loaders";
import { TimelineLoader } from "applesauce-loaders/loaders";
import { useObservableEagerMemo } from "applesauce-react/hooks";
import { ignoreUnhealthyRelaysOnPointers } from "applesauce-relay";
import hash_sum from "hash-sum";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { useCallback, useEffect, useMemo, useRef } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { combineLatestWith, map, merge, of, throttleTime } from "rxjs";

import { ErrorBoundary } from "../../components/error-boundary";
import SimpleView from "../../components/layout/presets/simple-view";
import OutboxRelaySelectionModal from "../../components/outbox-relay-selection-modal";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import { getArticleTitle } from "../../helpers/nostr/long-form";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { useVirtualListScrollRestore } from "../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import { eventStore } from "../../services/event-store";
import { liveness } from "../../services/pool";
import localSettings from "../../services/preferences";
import timelineCacheService from "../../services/timeline-cache";
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

  const { filter, listId, people } = usePeopleListContext();
  const selection = useObservableEagerMemo(() => {
    if (!people) return;

    return of(people).pipe(
      // Add users outbox relays
      includeMailboxes(eventStore, "outbox"),
      // Get the extra relays
      includeFallbackRelays(localSettings.fallbackRelays),
      // Ignore unhealthy relays
      ignoreUnhealthyRelaysOnPointers(liveness),
      // Get connection settings
      combineLatestWith(localSettings.maxConnections, localSettings.maxRelaysPerUser),
      // Only recalculate every 500ms
      throttleTime(500),
      // Select optimal relays
      map(([users, maxConnections, maxRelaysPerUser]) => {
        console.log(`Selecting relays for ${users.length} users`, {
          connections: maxConnections,
          maxPerUser: maxRelaysPerUser,
        });

        return selectOptimalRelays(users, { maxConnections, maxRelaysPerUser });
      }),
    );
  }, [people]);

  const outboxes = useMemo(() => {
    if (!selection) return;
    const outboxes = groupPubkeysByRelay(selection);

    if (import.meta.env.DEV) {
      console.table(
        Object.entries(outboxes)
          .map(([relay, users]) => ({ relay, users: users.length }))
          .sort((a, b) => b.users - a.users),
      );
    }

    return outboxes;
  }, [selection]);

  // Create loaders for each relay
  const loaders = useRef<TimelineLoader[]>([]);
  useEffect(() => {
    loaders.current = [];

    if (!outboxes) return;
    for (const [relay, users] of Object.entries(outboxes)) {
      const filter: TimelessFilter = { kinds: [kinds.LongFormArticle], authors: users.map((u) => u.pubkey) };

      loaders.current.push(
        timelineCacheService.createTimeline(`articles-${listId}-${relay}-${hash_sum(filter)}`, [relay], [filter]),
      );
    }
  }, [outboxes, listId]);

  // Merge all loaders
  const loader: TimelineLoader = useMemo(() => {
    return (since?: number) => merge(...loaders.current.map((l) => l(since)));
  }, []);

  // Subscribe to event store for timeline events
  const filters: Filter[] = useMemo(() => (filter ? [{ ...filter, kinds: [kinds.LongFormArticle] }] : []), [filter]);
  const articles = useObservableEagerMemo(
    () => (filters ? eventStore.timeline(filters).pipe(map((events) => events.filter(eventFilter))) : of([])),
    [filters, eventFilter],
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
