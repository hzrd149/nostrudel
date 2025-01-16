import { useOutletContext } from "react-router";
import { SimpleGrid } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";

import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { FLARE_VIDEO_KIND } from "../../helpers/nostr/video";
import VideoCard from "../videos/components/video-card";

export default function UserVideosTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const { loader, timeline: videos } = useTimelineLoader(pubkey + "-videos", readRelays, {
    authors: [pubkey],
    kinds: [FLARE_VIDEO_KIND],
  });
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing="4">
          {videos?.map((video) => <VideoCard key={getEventUID(video)} video={video} />)}
        </SimpleGrid>
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
