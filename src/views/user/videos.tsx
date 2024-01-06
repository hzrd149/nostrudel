import { useOutletContext } from "react-router-dom";
import { SimpleGrid } from "@chakra-ui/react";

import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import { getEventUID } from "../../helpers/nostr/events";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { FLARE_VIDEO_KIND } from "../../helpers/nostr/flare";
import VideoCard from "../videos/components/video-card";

export default function UserVideosTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const timeline = useTimelineLoader(pubkey + "-videos", readRelays, {
    authors: [pubkey],
    kinds: [FLARE_VIDEO_KIND],
  });
  const videos = useSubject(timeline.timeline);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing="4">
          {videos.map((video) => (
            <VideoCard key={getEventUID(video)} video={video} />
          ))}
        </SimpleGrid>
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
