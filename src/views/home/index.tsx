import { Flex, Spacer } from "@chakra-ui/react";
import { useEventModel, useObservableEagerMemo } from "applesauce-react/hooks";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { useCallback, useEffect, useMemo } from "react";
import { map, of } from "rxjs";

import NoteFilterTypeButtons from "../../components/note-filter-type-buttons";
import OutboxRelaySelectionModal from "../../components/outbox-relay-selection-modal";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import TimelinePage, { useTimelinePageEventFilter } from "../../components/timeline-page";
import TimelineViewTypeButtons from "../../components/timeline-page/timeline-view-type";
import { isReply, isRepost } from "../../helpers/nostr/event";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { useLoaderForOutboxes } from "../../hooks/use-loaders-for-outboxes";
import useLocalStorageDisclosure from "../../hooks/use-localstorage-disclosure";
import { OutboxSelectionModel } from "../../models/outbox-selection";
import KindSelectionProvider, { useKindSelectionContext } from "../../providers/local/kind-selection-provider";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import { eventStore } from "../../services/event-store";

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

  const { listId, filter, pointer } = usePeopleListContext();
  const { kinds } = useKindSelectionContext();
  const { selection, outboxes } = useEventModel(OutboxSelectionModel, pointer ? [pointer] : undefined) ?? {};

  // Merge all loaders
  const loader = useLoaderForOutboxes(`home-${listId}`, outboxes, kinds);

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
      {outboxes && selection && <OutboxRelaySelectionModal outboxMap={outboxes} selection={selection} />}
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
