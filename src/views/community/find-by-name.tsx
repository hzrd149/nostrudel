import { useCallback } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Heading, SimpleGrid } from "@chakra-ui/react";
import { kinds } from "nostr-tools";

import { useReadRelays } from "../../hooks/use-client-relays";
import { validateCommunity } from "../../helpers/nostr/communities";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
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
  if (decoded?.type === "naddr" && decoded.data.kind === kinds.CommunityDefinition) {
    return <Navigate to={`/c/${decoded.data.identifier}/${decoded.data.pubkey}`} replace />;
  }

  const readRelays = useReadRelays();
  const eventFilter = useCallback((event: NostrEvent) => {
    return validateCommunity(event);
  }, []);
  const { loader, timeline: communities } = useTimelineLoader(
    `${community}-find-communities`,
    readRelays,
    community ? { kinds: [kinds.CommunityDefinition], "#d": [community] } : undefined,
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <Heading>Select Community</Heading>
        <SimpleGrid spacing="2" columns={{ base: 1, lg: 2 }}>
          {communities?.map((event) => <CommunityCard key={getEventUID(event)} community={event} />)}
        </SimpleGrid>
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
