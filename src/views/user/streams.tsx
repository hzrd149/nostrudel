import { SimpleGrid } from "@chakra-ui/react";
import { useOutletContext } from "react-router";
import { kinds } from "nostr-tools";
import { getEventUID } from "applesauce-core/helpers";

import { truncatedId } from "../../helpers/nostr/event";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import StreamCard from "../streams/components/stream-card";
import VerticalPageLayout from "../../components/vertical-page-layout";

export default function UserStreamsTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const { loader, timeline: streams } = useTimelineLoader(truncatedId(pubkey) + "-streams", readRelays, [
    {
      authors: [pubkey],
      kinds: [kinds.LiveEvent],
    },
    { "#p": [pubkey], kinds: [kinds.LiveEvent] },
  ]);

  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4, "2xl": 5 }} spacing="2">
          {streams.map((stream) => (
            <StreamCard key={getEventUID(stream)} stream={stream} />
          ))}
        </SimpleGrid>
        <TimelineActionAndStatus timeline={loader} />
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
