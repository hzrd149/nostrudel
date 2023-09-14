import { useCallback } from "react";
import { useParams } from "react-router-dom";

import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { COMMUNITY_DEFINITION_KIND, validateCommunity } from "../../helpers/nostr/communities";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import useSubject from "../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import VerticalPageLayout from "../../components/vertical-page-layout";
import CommunityCard from "../communities/components/community-card";
import { getEventUID } from "../../helpers/nostr/events";
import { Divider, Heading } from "@chakra-ui/react";

export default function CommunityFindByNameView() {
  const { community } = useParams() as { community: string };

  const readRelays = useReadRelayUrls();
  const eventFilter = useCallback((event: NostrEvent) => {
    return validateCommunity(event);
  }, []);
  const timeline = useTimelineLoader(
    `${community}-find-communities`,
    readRelays,
    { kinds: [COMMUNITY_DEFINITION_KIND], "#d": [community] },
    { enabled: !!community },
  );

  const communities = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <Heading>Select Community:</Heading>
        <Divider />
        {communities.map((event) => (
          <CommunityCard key={getEventUID(event)} community={event} />
        ))}
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
