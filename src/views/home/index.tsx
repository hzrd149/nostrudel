import { useCallback, useMemo } from "react";
import { Flex } from "@chakra-ui/react";
import { Kind } from "nostr-tools";

import { isReply } from "../../helpers/nostr/events";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import TimelinePage, { useTimelinePageEventFilter } from "../../components/timeline-page";
import TimelineViewTypeButtons from "../../components/timeline-page/timeline-view-type";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import PeopleListProvider, { usePeopleListContext } from "../../providers/people-list-provider";
import RelaySelectionProvider, { useRelaySelectionContext } from "../../providers/relay-selection-provider";
import { NostrRequestFilter } from "../../types/nostr-query";

function HomePage() {
  const timelinePageEventFilter = useTimelinePageEventFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (isReply(event)) return false;
      return timelinePageEventFilter(event);
    },
    [timelinePageEventFilter],
  );

  const { relays } = useRelaySelectionContext();
  const { list, filter } = usePeopleListContext();

  const kinds = [Kind.Text, Kind.Repost, 2];
  const query = useMemo<NostrRequestFilter>(() => {
    if (filter === undefined) return { kinds };
    return { ...filter, kinds };
  }, [filter]);

  const timeline = useTimelineLoader(`${list}-home-feed`, relays, query, {
    enabled: !!filter,
    eventFilter,
  });

  const header = (
    <Flex gap="2" wrap="wrap" px={["2", 0]}>
      <PeopleListSelection />
      <RelaySelectionButton ml="auto" />
      <TimelineViewTypeButtons />
    </Flex>
  );

  return <TimelinePage timeline={timeline} header={header} pt="2" pb="8" />;
}

export default function HomeView() {
  return (
    <PeopleListProvider>
      <RelaySelectionProvider>
        <HomePage />
      </RelaySelectionProvider>
    </PeopleListProvider>
  );
}
