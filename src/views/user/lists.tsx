import { useOutletContext } from "react-router-dom";
import { SimpleGrid } from "@chakra-ui/react";

import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import { NOTE_LIST_KIND, PEOPLE_LIST_KIND } from "../../helpers/nostr/lists";
import { getEventUID, truncatedId } from "../../helpers/nostr/events";
import ListCard from "../lists/components/list-card";

export default function UserListsTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const timeline = useTimelineLoader(truncatedId(pubkey) + "-lists", readRelays, {
    authors: [pubkey],
    kinds: [PEOPLE_LIST_KIND, NOTE_LIST_KIND],
  });

  const events = useSubject(timeline.timeline);

  return (
    <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2" py="2" px={["2", "2", 0]}>
      <ListCard cord={`3:${pubkey}`} />
      <ListCard cord={`10000:${pubkey}`} />
      {events.map((event) => (
        <ListCard key={getEventUID(event)} event={event} />
      ))}
    </SimpleGrid>
  );
}
