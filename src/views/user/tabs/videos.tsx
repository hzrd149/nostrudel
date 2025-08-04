import { SimpleGrid } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";

import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import VideoCard from "../../videos/components/video-card";

import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import { FLARE_VIDEO_KIND } from "../../../helpers/nostr/video";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
export default function UserVideosTab() {
  const user = useParamsProfilePointer("pubkey");
  const mailboxes = useUserMailboxes(user);
  const readRelays = useReadRelays();

  const { loader, timeline: videos } = useTimelineLoader(user.pubkey + "-videos", mailboxes?.outboxes || readRelays, {
    authors: [user.pubkey],
    kinds: [FLARE_VIDEO_KIND],
  });
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <ScrollLayout>
      <IntersectionObserverProvider callback={callback}>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing="4">
          {videos?.map((video) => (
            <VideoCard key={getEventUID(video)} video={video} />
          ))}
        </SimpleGrid>
      </IntersectionObserverProvider>
    </ScrollLayout>
  );
}
