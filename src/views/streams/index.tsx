import { useCallback, useMemo } from "react";
import { Flex, Heading, SimpleGrid, Switch } from "@chakra-ui/react";

import useTimelineLoader from "../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useSubject from "../../hooks/use-subject";
import StreamCard from "./components/stream-card";
import { STREAM_KIND } from "../../helpers/nostr/stream";
import useRelaysChanged from "../../hooks/use-relays-changed";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import useParsedStreams from "../../hooks/use-parsed-streams";
import { NostrRequestFilter } from "../../types/nostr-relay";
import { useAppTitle } from "../../hooks/use-app-title";
import { NostrEvent } from "../../types/nostr-event";
import VerticalPageLayout from "../../components/vertical-page-layout";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { useRouteStateBoolean } from "../../hooks/use-route-state-value";
import { useReadRelays } from "../../hooks/use-client-relays";
import { AdditionalRelayProvider, useAdditionalRelayContext } from "../../providers/local/additional-relay-context";

function StreamsPage() {
  useAppTitle("Streams");
  const relays = useReadRelays(useAdditionalRelayContext()).urls;
  const userMuteFilter = useClientSideMuteFilter();
  const showEnded = useRouteStateBoolean("ended", false);

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (userMuteFilter(event)) return false;
      return true;
    },
    [userMuteFilter],
  );

  const { filter, listId } = usePeopleListContext();
  const query = useMemo<NostrRequestFilter | undefined>(() => {
    if (!filter) return undefined;
    return [
      { authors: filter.authors, kinds: [STREAM_KIND] },
      { "#p": filter.authors, kinds: [STREAM_KIND] },
    ];
  }, [filter]);

  const timeline = useTimelineLoader(`${listId ?? "global"}-streams`, relays, query, { eventFilter });

  useRelaysChanged(relays, () => timeline.reset());

  const callback = useTimelineCurserIntersectionCallback(timeline);

  const events = useSubject(timeline.timeline);
  const streams = useParsedStreams(events);

  const liveStreams = streams.filter((stream) => stream.status === "live");
  const endedStreams = streams.filter((stream) => stream.status === "ended");

  return (
    <VerticalPageLayout>
      <Flex gap="2" wrap="wrap" alignItems="center">
        <PeopleListSelection />
        <Switch checked={showEnded.isOpen} onChange={showEnded.onToggle}>
          Show Ended
        </Switch>
      </Flex>
      <IntersectionObserverProvider callback={callback}>
        <Heading size="lg" mt="2">
          Live
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing="2">
          {liveStreams.map((stream) => (
            <StreamCard key={stream.event.id} stream={stream} />
          ))}
        </SimpleGrid>
        {showEnded.isOpen && (
          <>
            <Heading size="lg" mt="4">
              Ended
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing="2">
              {endedStreams.map((stream) => (
                <StreamCard key={stream.event.id} stream={stream} />
              ))}
            </SimpleGrid>
          </>
        )}
        <TimelineActionAndStatus timeline={timeline} />
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}
export default function StreamsView() {
  return (
    <AdditionalRelayProvider
      relays={["wss://nos.lol", "wss://relay.damus.io", "wss://relay.snort.social", "wss://nostr.wine"]}
    >
      <PeopleListProvider>
        <StreamsPage />
      </PeopleListProvider>
    </AdditionalRelayProvider>
  );
}
