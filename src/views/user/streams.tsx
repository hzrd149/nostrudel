import { useRef } from "react";
import { Flex } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import { truncatedId } from "../../helpers/nostr-event";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import GenericNoteTimeline from "../../components/timeline-page/generic-note-timeline";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { STREAM_KIND } from "../../helpers/nostr/stream";

export default function UserStreamsTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const timeline = useTimelineLoader(truncatedId(pubkey) + "-streams", readRelays, [
    {
      authors: [pubkey],
      kinds: [STREAM_KIND],
    },
    { "#p": [pubkey], kinds: [STREAM_KIND] },
  ]);

  const scrollBox = useRef<HTMLDivElement | null>(null);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider<string> root={scrollBox} callback={callback}>
      <Flex direction="column" gap="2" pt="4" pb="8" h="full" overflowY="auto" overflowX="hidden" ref={scrollBox}>
        <GenericNoteTimeline timeline={timeline} />
        <TimelineActionAndStatus timeline={timeline} />
      </Flex>
    </IntersectionObserverProvider>
  );
}
