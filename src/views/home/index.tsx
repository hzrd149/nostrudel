import { Flex, Spacer } from "@chakra-ui/react";
import { includeFallbackRelays, includeMailboxes } from "applesauce-core";
import { groupPubkeysByRelay, selectOptimalRelays } from "applesauce-core/helpers";
import { TimelessFilter } from "applesauce-loaders";
import { TimelineLoader } from "applesauce-loaders/loaders";
import { useObservableEagerMemo } from "applesauce-react/hooks";
import hash_sum from "hash-sum";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { combineLatestWith, map, merge, of, throttleTime } from "rxjs";

import { ignoreUnhealthyRelaysOnPointers } from "applesauce-relay";
import NoteFilterTypeButtons from "../../components/note-filter-type-buttons";
import OutboxRelayDebugger from "../../components/outbox-relay-debugger";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import TimelinePage, { useTimelinePageEventFilter } from "../../components/timeline-page";
import TimelineViewTypeButtons from "../../components/timeline-page/timeline-view-type";
import { isReply, isRepost } from "../../helpers/nostr/event";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import useLocalStorageDisclosure from "../../hooks/use-localstorage-disclosure";
import KindSelectionProvider, { useKindSelectionContext } from "../../providers/local/kind-selection-provider";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import { eventStore } from "../../services/event-store";
import { liveness } from "../../services/pool";
import localSettings from "../../services/preferences";
import timelineCacheService from "../../services/timeline-cache";

const defaultKinds = [kinds.ShortTextNote, kinds.Repost, kinds.GenericRepost];

function HomePage() {
  const showReplies = useLocalStorageDisclosure("show-replies", false);
  const showReposts = useLocalStorageDisclosure("show-reposts", true);

  const timelinePageEventFilter = useTimelinePageEventFilter();
  const muteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (muteFilter(event)) return false;
      if (!showReplies.isOpen && isReply(event)) return false;
      if (!showReposts.isOpen && isRepost(event)) return false;
      return timelinePageEventFilter(event);
    },
    [timelinePageEventFilter, showReplies.isOpen, showReposts.isOpen, muteFilter],
  );

  const { listId, filter, people } = usePeopleListContext();
  const { kinds } = useKindSelectionContext();
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
      // Only recalculate every 200ms
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
      const filter: TimelessFilter = { kinds, authors: users.map((u) => u.pubkey) };

      loaders.current.push(
        timelineCacheService.createTimeline(`home-${listId}-${relay}-${hash_sum(filter)}`, [relay], [filter]),
      );
    }
  }, [outboxes, listId, kinds]);

  // Merge all loaders
  const loader: TimelineLoader = useMemo(() => {
    return (since?: number) => merge(...loaders.current.map((l) => l(since)));
  }, []);

  // Subscribe to event store for timeline events
  const filters: Filter[] = useMemo(() => (filter ? [{ ...filter, kinds }] : []), [filter, kinds]);
  const timeline = useObservableEagerMemo(
    () => (filters ? eventStore.timeline(filters).pipe(map((events) => events.filter(eventFilter))) : of([])),
    [filters, eventFilter],
  );

  const header = (
    <Flex gap="2" wrap="wrap" alignItems="center">
      <PeopleListSelection />
      <NoteFilterTypeButtons showReplies={showReplies} showReposts={showReposts} />
      <Spacer />
      {outboxes && selection && <OutboxRelayDebugger outboxMap={outboxes} selection={selection} />}
      <TimelineViewTypeButtons />
    </Flex>
  );

  return <TimelinePage loader={loader} timeline={timeline} header={header} pt="2" pb="12" px="2" maxW="6xl" />;
}

export default function HomeView() {
  return (
    <PeopleListProvider>
      <KindSelectionProvider initKinds={defaultKinds}>
        <HomePage />
      </KindSelectionProvider>
    </PeopleListProvider>
  );
}
