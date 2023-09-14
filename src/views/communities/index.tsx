import { useCallback, useMemo } from "react";
import { Flex, SimpleGrid } from "@chakra-ui/react";

import PeopleListProvider, { usePeopleListContext } from "../../providers/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useSubject from "../../hooks/use-subject";
import CommunityCard from "./components/community-card";
import { getEventUID } from "../../helpers/nostr/events";
import VerticalPageLayout from "../../components/vertical-page-layout";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import RelaySelectionProvider, { useRelaySelectionContext } from "../../providers/relay-selection-provider";
import { COMMUNITY_DEFINITION_KIND, validateCommunity } from "../../helpers/nostr/communities";
import { NostrEvent } from "../../types/nostr-event";
import { NostrQuery } from "../../types/nostr-query";

function CommunitiesHomePage() {
  const { filter, listId } = usePeopleListContext();
  const { relays } = useRelaySelectionContext();

  const eventFilter = useCallback((event: NostrEvent) => {
    return validateCommunity(event);
  }, []);

  const query = useMemo(() => {
    const base: NostrQuery = { kinds: [COMMUNITY_DEFINITION_KIND] };
    if (filter?.authors) {
      base.authors = filter.authors;
      base["#p"] = filter.authors;
    }
    return base;
  }, [filter]);

  const timeline = useTimelineLoader(`${listId}-browse-communities`, relays, query, { enabled: !!filter, eventFilter });

  const communities = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <Flex gap="2" alignItems="center" wrap="wrap">
          <PeopleListSelection />
          <RelaySelectionButton />
        </Flex>
        <SimpleGrid columns={[1, 1, 1, 2]} spacing="2">
          {communities.map((event) => (
            <CommunityCard key={getEventUID(event)} community={event} />
          ))}
        </SimpleGrid>
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}

export default function CommunitiesHomeView() {
  return (
    <PeopleListProvider initList="global">
      <RelaySelectionProvider>
        <CommunitiesHomePage />
      </RelaySelectionProvider>
    </PeopleListProvider>
  );
}
