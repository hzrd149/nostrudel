import { useOutletContext } from "react-router-dom";
import { Divider, Flex, Heading, SimpleGrid } from "@chakra-ui/react";

import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import { MUTE_LIST_KIND, NOTE_LIST_KIND, PEOPLE_LIST_KIND, PIN_LIST_KIND } from "../../helpers/nostr/lists";
import { getEventUID, truncatedId } from "../../helpers/nostr/events";
import ListCard from "../lists/components/list-card";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import { Kind } from "nostr-tools";

export default function UserListsTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const timeline = useTimelineLoader(truncatedId(pubkey) + "-lists", readRelays, {
    authors: [pubkey],
    kinds: [PEOPLE_LIST_KIND, NOTE_LIST_KIND],
  });

  const lists = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  const peopleLists = lists.filter((event) => event.kind === PEOPLE_LIST_KIND);
  const noteLists = lists.filter((event) => event.kind === NOTE_LIST_KIND);

  return (
    <IntersectionObserverProvider callback={callback}>
      <Flex gap="2" pt="2" pb="10" px={["2", "2", 0]} direction="column">
        <Heading size="md">Special lists</Heading>
        <Divider />
        <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
          <ListCard cord={`${Kind.Contacts}:${pubkey}`} />
          <ListCard cord={`${MUTE_LIST_KIND}:${pubkey}`} />
          <ListCard cord={`${PIN_LIST_KIND}:${pubkey}`} />
        </SimpleGrid>

        {peopleLists.length > 0 && (
          <>
            <Heading size="md">People lists</Heading>
            <Divider />
            <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
              {peopleLists.map((event) => (
                <ListCard key={getEventUID(event)} event={event} />
              ))}
            </SimpleGrid>
          </>
        )}

        {noteLists.length > 0 && (
          <>
            <Heading size="md">Bookmark lists</Heading>
            <Divider />
            <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
              {noteLists.map((event) => (
                <ListCard key={getEventUID(event)} event={event} />
              ))}
            </SimpleGrid>
          </>
        )}
      </Flex>
    </IntersectionObserverProvider>
  );
}
