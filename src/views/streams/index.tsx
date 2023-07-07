import { useCallback, useMemo, useRef, useState } from "react";
import { Flex, Select } from "@chakra-ui/react";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useSubject from "../../hooks/use-subject";
import StreamCard from "./components/stream-card";
import { ParsedStream, STREAM_KIND, getATag, parseStreamEvent } from "../../helpers/nostr/stream";
import { NostrEvent } from "../../types/nostr-event";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import RelaySelectionProvider, { useRelaySelectionRelays } from "../../providers/relay-selection-provider";
import useRelaysChanged from "../../hooks/use-relays-changed";

function StreamsPage() {
  // hard code damus and snort relays for finding streams
  const readRelays = useRelaySelectionRelays(); //useReadRelayUrls(["wss://relay.damus.io", "wss://relay.snort.social"]);
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

  const timeline = useTimelineLoader(`streams`, readRelays, { kinds: [STREAM_KIND] }, { eventFilter });

  useRelaysChanged(readRelays, () => timeline.reset());

  const scrollBox = useRef<HTMLDivElement | null>(null);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  const events = useSubject(timeline.timeline);
  const streams = useMemo(() => {
    const parsedStreams: Record<string, ParsedStream> = {};
    for (const event of events) {
      try {
        const parsed = parseStreamEvent(event);
        const aTag = getATag(parsed);
        if (!parsedStreams[aTag] || parsed.event.created_at > parsedStreams[aTag].event.created_at) {
          parsedStreams[aTag] = parsed;
        }
      } catch (e) {}
    }
    return Array.from(Object.values(parsedStreams)).sort((a, b) => b.updated - a.updated);
  }, [events]);

  return (
    <Flex p="2" gap="2" overflow="hidden" direction="column">
      <Flex gap="2">
        <Select maxW="sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="live">Live</option>
          <option value="ended">Ended</option>
        </Select>
        <RelaySelectionButton ml="auto" />
      </Flex>
      <IntersectionObserverProvider callback={callback} root={scrollBox}>
        <Flex gap="2" wrap="wrap" overflowY="auto" overflowX="hidden" ref={scrollBox}>
          {streams.map((stream) => (
            <StreamCard key={stream.event.id} stream={stream} w="sm" />
          ))}
        </Flex>
      </IntersectionObserverProvider>
    </Flex>
  );
}
export default function StreamsView() {
  return (
    <RelaySelectionProvider
      additionalDefaults={["wss://nos.lol", "wss://relay.damus.io", "wss://relay.snort.social", "wss://nostr.wine"]}
    >
      <StreamsPage />
    </RelaySelectionProvider>
  );
}
