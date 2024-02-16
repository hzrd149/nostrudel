import { useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { Box, SimpleGrid } from "@chakra-ui/react";

import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import { getEventUID } from "../../helpers/nostr/event";
import IntersectionObserverProvider, {
  useRegisterIntersectionEntity,
} from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { STEMSTR_TRACK_KIND } from "../../helpers/nostr/stemstr";
import EmbeddedStemstrTrack from "../../components/embed-event/event-types/embedded-stemstr-track";
import { unique } from "../../helpers/array";
import { NostrEvent } from "../../types/nostr-event";

function Track({ track }: { track: NostrEvent }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(track));

  return (
    <Box ref={ref}>
      <EmbeddedStemstrTrack track={track} />
    </Box>
  );
}

export default function UserTracksTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const timeline = useTimelineLoader(pubkey + "-tracks", unique([...readRelays, "wss://relay.stemstr.app"]), {
    authors: [pubkey],
    kinds: [STEMSTR_TRACK_KIND],
  });
  const tracks = useSubject(timeline.timeline);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="4">
          {tracks.map((track) => (
            <Track key={getEventUID(track)} track={track} />
          ))}
        </SimpleGrid>
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
