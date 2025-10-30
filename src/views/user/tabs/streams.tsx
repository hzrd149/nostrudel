import { SimpleGrid } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";

import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import LoadMoreButton from "../../../components/timeline/load-more-button";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useUserOutbox } from "../../../hooks/use-user-mailboxes";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import StreamCard from "../../streams/components/stream-card";

export default function UserStreamsTab() {
  const user = useParamsProfilePointer("pubkey");
  const relays = useUserOutbox(user) || [];

  const { loader, timeline: streams } = useTimelineLoader(user.pubkey + "-streams", relays, [
    {
      authors: [user.pubkey],
      kinds: [kinds.LiveEvent],
    },
    { "#p": [user.pubkey], kinds: [kinds.LiveEvent] },
  ]);

  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <ScrollLayout>
      <IntersectionObserverProvider callback={callback}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4, "2xl": 5 }} spacing="2">
          {streams.map((stream) => (
            <StreamCard key={getEventUID(stream)} stream={stream} />
          ))}
        </SimpleGrid>
        <LoadMoreButton loader={loader} />
      </IntersectionObserverProvider>
    </ScrollLayout>
  );
}
