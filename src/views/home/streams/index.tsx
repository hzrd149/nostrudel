import { Flex, Select } from "@chakra-ui/react";
import { useTimelineLoader } from "../../../hooks/use-timeline-loader";
import { useCallback, useMemo, useRef, useState } from "react";
import { useReadRelayUrls } from "../../../hooks/use-client-relays";
import IntersectionObserverProvider from "../../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useSubject from "../../../hooks/use-subject";
import StreamCard from "./stream-card";
import { ParsedStream, parseStreamEvent } from "../../../helpers/nostr/stream";
import { NostrEvent } from "../../../types/nostr-event";

export default function LiveStreamsTab() {
  const readRelays = useReadRelayUrls();
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
  const timeline = useTimelineLoader(`streams`, readRelays, { kinds: [30311] }, { eventFilter });
  const scrollBox = useRef<HTMLDivElement | null>(null);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  const events = useSubject(timeline.timeline);
  const streams = useMemo(() => {
    const parsed: ParsedStream[] = [];
    for (const event of events) {
      try {
        parsed.push(parseStreamEvent(event));
      } catch (e) {}
    }
    return parsed.sort((a, b) => b.updated - a.updated);
  }, [events]);

  return (
    <Flex p="2" gap="2" overflow="hidden" direction="column">
      <Select maxW="sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
        <option value="live">Live</option>
        <option value="ended">Ended</option>
      </Select>
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
