import { useCallback, useMemo, useRef, useState } from "react";
import { Flex, Select } from "@chakra-ui/react";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useSubject from "../../hooks/use-subject";
import StreamCard from "./components/stream-card";
import { ParsedStream, STREAM_KIND, parseStreamEvent } from "../../helpers/nostr/stream";
import { NostrEvent } from "../../types/nostr-event";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import RelaySelectionProvider, { useRelaySelectionRelays } from "../../providers/relay-selection-provider";
import useRelaysChanged from "../../hooks/use-relays-changed";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import PeopleListProvider, { usePeopleListContext } from "../../components/people-list-selection/people-list-provider";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";

function StreamsPage() {
  const relays = useRelaySelectionRelays();
  const [filterStatus, setFilterStatus] = useState<string>("live");

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      try {
        const parsed = parseStreamEvent(event);
        return parsed.status === filterStatus;
      } catch (e) {}
      return false;
    },
    [filterStatus]
  );

  const { people } = usePeopleListContext();
  const query =
    people.length > 0
      ? [
          { authors: people, kinds: [STREAM_KIND] },
          { "#p": people, kinds: [STREAM_KIND] },
        ]
      : { kinds: [STREAM_KIND] };
  const timeline = useTimelineLoader(`streams`, relays, query, { eventFilter });

  useRelaysChanged(relays, () => timeline.reset());

  const callback = useTimelineCurserIntersectionCallback(timeline);

  const events = useSubject(timeline.timeline);
  const streams = useMemo(() => {
    const parsedStreams: ParsedStream[] = [];
    for (const event of events) {
      try {
        const parsed = parseStreamEvent(event);
        parsedStreams.push(parsed);
      } catch (e) {}
    }
    return parsedStreams.sort((a, b) => (b.starts ?? 0) - (a.starts ?? 0));
  }, [events]);

  return (
    <Flex p="2" gap="2" overflow="hidden" direction="column">
      <Flex gap="2">
        <PeopleListSelection maxW="sm" />
        <Select maxW="sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="live">Live</option>
          <option value="ended">Ended</option>
        </Select>
        <RelaySelectionButton ml="auto" />
      </Flex>
      <IntersectionObserverProvider callback={callback}>
        <Flex gap="2" wrap="wrap">
          {streams.map((stream) => (
            <StreamCard key={stream.event.id} stream={stream} w="sm" />
          ))}
          <TimelineActionAndStatus timeline={timeline} />
        </Flex>
      </IntersectionObserverProvider>
    </Flex>
  );
}
export default function StreamsView() {
  return (
    <RelaySelectionProvider
      overrideDefault={["wss://nos.lol", "wss://relay.damus.io", "wss://relay.snort.social", "wss://nostr.wine"]}
    >
      <PeopleListProvider>
        <StreamsPage />
      </PeopleListProvider>
    </RelaySelectionProvider>
  );
}
