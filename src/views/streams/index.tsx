import { useCallback, useMemo } from "react";
import { Divider, Flex, Heading, SimpleGrid } from "@chakra-ui/react";

import useTimelineLoader from "../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useSubject from "../../hooks/use-subject";
import StreamCard from "./components/stream-card";
import { STREAM_KIND } from "../../helpers/nostr/stream";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import RelaySelectionProvider, { useRelaySelectionRelays } from "../../providers/relay-selection-provider";
import useRelaysChanged from "../../hooks/use-relays-changed";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import PeopleListProvider, { usePeopleListContext } from "../../providers/people-list-provider";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import useParsedStreams from "../../hooks/use-parsed-streams";
import { NostrRequestFilter } from "../../types/nostr-query";
import { useAppTitle } from "../../hooks/use-app-title";
import { NostrEvent } from "../../types/nostr-event";
import VerticalPageLayout from "../../components/vertical-page-layout";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";

function StreamsPage() {
  useAppTitle("Streams");
  const relays = useRelaySelectionRelays();
  const userMuteFilter = useClientSideMuteFilter();

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (userMuteFilter(event)) return false;
      return true;
    },
    [userMuteFilter],
  );

  const { filter, listId } = usePeopleListContext();
  const query = useMemo<NostrRequestFilter>(() => {
    if (!listId || !filter) return { kinds: [STREAM_KIND] };
    return [
      { authors: filter.authors, kinds: [STREAM_KIND] },
      { "#p": filter.authors, kinds: [STREAM_KIND] },
    ];
  }, [filter, listId]);

  const timeline = useTimelineLoader(`${listId}-streams`, relays, query, { enabled: !!filter, eventFilter });

  useRelaysChanged(relays, () => timeline.reset());

  const callback = useTimelineCurserIntersectionCallback(timeline);

  const events = useSubject(timeline.timeline);
  const streams = useParsedStreams(events);

  const liveStreams = streams.filter((stream) => stream.status === "live");
  const endedStreams = streams.filter((stream) => stream.status === "ended");

  return (
    <VerticalPageLayout>
      <Flex gap="2" wrap="wrap">
        <PeopleListSelection />
        <RelaySelectionButton ml="auto" />
      </Flex>
      <IntersectionObserverProvider callback={callback}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing="2">
          {liveStreams.map((stream) => (
            <StreamCard key={stream.event.id} stream={stream} />
          ))}
        </SimpleGrid>
        <Heading>Ended</Heading>
        <Divider />
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing="2">
          {endedStreams.map((stream) => (
            <StreamCard key={stream.event.id} stream={stream} />
          ))}
        </SimpleGrid>
        <TimelineActionAndStatus timeline={timeline} />
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}
export default function StreamsView() {
  return (
    <RelaySelectionProvider
      additionalDefaults={["wss://nos.lol", "wss://relay.damus.io", "wss://relay.snort.social", "wss://nostr.wine"]}
    >
      <PeopleListProvider>
        <StreamsPage />
      </PeopleListProvider>
    </RelaySelectionProvider>
  );
}
