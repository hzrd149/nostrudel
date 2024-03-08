import { useCallback } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Heading, SimpleGrid } from "@chakra-ui/react";

import { useReadRelays } from "../../hooks/use-client-relays";
import { COMMUNITY_DEFINITION_KIND, validateCommunity } from "../../helpers/nostr/communities";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import useSubject from "../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import VerticalPageLayout from "../../components/vertical-page-layout";
import CommunityCard from "../communities/components/community-card";
import { getEventUID } from "../../helpers/nostr/event";
import { safeDecode } from "../../helpers/nip19";

export default function CommunityFindByNameView() {
  const { community } = useParams() as { community: string };

  // if community name is a naddr, redirect
  const decoded = safeDecode(community);
  if (decoded?.type === "naddr" && decoded.data.kind === COMMUNITY_DEFINITION_KIND) {
    return <Navigate to={`/c/${decoded.data.identifier}/${decoded.data.pubkey}`} replace />;
  }

  const readRelays = useReadRelays();
  const eventFilter = useCallback((event: NostrEvent) => {
    return validateCommunity(event);
  }, []);
  const timeline = useTimelineLoader(
    `${community}-find-communities`,
    readRelays,
    community ? { kinds: [COMMUNITY_DEFINITION_KIND], "#d": [community] } : undefined,
  );

  const communities = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <Heading>Select Community</Heading>
        <SimpleGrid spacing="2" columns={{ base: 1, lg: 2 }}>
          {communities.map((event) => (
            <CommunityCard key={getEventUID(event)} community={event} />
          ))}
        </SimpleGrid>
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
