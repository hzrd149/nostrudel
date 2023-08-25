import { useCallback } from "react";
import { Flex } from "@chakra-ui/react";
import { Kind } from "nostr-tools";

import { isReply, truncatedId } from "../../helpers/nostr/events";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { NostrEvent } from "../../types/nostr-event";
import TimelinePage, { useTimelinePageEventFilter } from "../../components/timeline-page";
import TimelineViewTypeButtons from "../../components/timeline-page/timeline-view-type";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import PeopleListProvider, { usePeopleListContext } from "../../providers/people-list-provider";
import RelaySelectionProvider, { useRelaySelectionContext } from "../../providers/relay-selection-provider";

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
  const { people, list } = usePeopleListContext();

  const kinds = [Kind.Text, Kind.Repost, 2];
  const query = people && people.length > 0 ? { authors: people.map((p) => p.pubkey), kinds } : { kinds };
  const timeline = useTimelineLoader(`${list}-home-feed`, relays, query, {
    enabled: !!people && people.length > 0,
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
