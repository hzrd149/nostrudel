import { useOutletContext } from "react-router-dom";
import { SimpleGrid } from "@chakra-ui/react";

import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import { NOTE_LIST_KIND, PEOPLE_LIST_KIND } from "../../helpers/nostr/lists";
import { getEventUID, truncatedId } from "../../helpers/nostr/events";
import ListCard from "../lists/components/list-card";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";

export default function UserListsTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const timeline = useTimelineLoader(truncatedId(pubkey) + "-lists", readRelays, {
    authors: [pubkey],
    kinds: [PEOPLE_LIST_KIND, NOTE_LIST_KIND],
  });

  const events = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2" py="2" px={["2", "2", 0]}>
        <ListCard cord={`3:${pubkey}`} />
        <ListCard cord={`10000:${pubkey}`} />
        {events.map((event) => (
          <ListCard key={getEventUID(event)} event={event} />
        ))}
      </SimpleGrid>
      <TimelineActionAndStatus timeline={timeline} />
    </IntersectionObserverProvider>
  );
}
