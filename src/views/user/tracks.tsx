import { Box, SimpleGrid } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useOutletContext } from "react-router-dom";

import EmbeddedStemstrTrack from "../../components/embed-event/card/embedded-stemstr-track";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { unique } from "../../helpers/array";
import { getEventUID } from "../../helpers/nostr/event";
import { STEMSTR_TRACK_KIND } from "../../helpers/nostr/stemstr";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";

function Track({ track }: { track: NostrEvent }) {
  const ref = useEventIntersectionRef(track);

  return (
    <Box ref={ref}>
      <EmbeddedStemstrTrack track={track} />
    </Box>
  );
}

export default function UserTracksTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const { loader, timeline: tracks } = useTimelineLoader(
    pubkey + "-tracks",
    unique([...readRelays, "wss://relay.stemstr.app"]),
    {
      authors: [pubkey],
      kinds: [STEMSTR_TRACK_KIND],
    },
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="4">
          {tracks?.map((track) => <Track key={getEventUID(track)} track={track} />)}
        </SimpleGrid>
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
