import { useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { Divider, Heading, SimpleGrid } from "@chakra-ui/react";

import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import { MUTE_LIST_KIND, NOTE_LIST_KIND, PEOPLE_LIST_KIND, PIN_LIST_KIND, isJunkList } from "../../helpers/nostr/lists";
import { getEventUID } from "../../helpers/nostr/events";
import ListCard from "../lists/components/list-card";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { Kind } from "nostr-tools";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { NostrEvent } from "../../types/nostr-event";

export default function UserListsTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const eventFilter = useCallback((event: NostrEvent) => {
    return !isJunkList(event);
  }, []);
  const timeline = useTimelineLoader(
    pubkey + "-lists",
    readRelays,
    {
      authors: [pubkey],
      kinds: [PEOPLE_LIST_KIND, NOTE_LIST_KIND],
    },
    { eventFilter },
  );

  const lists = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  const peopleLists = lists.filter((event) => event.kind === PEOPLE_LIST_KIND);
  const noteLists = lists.filter((event) => event.kind === NOTE_LIST_KIND);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <Heading size="md" mt="2">
          Special lists
        </Heading>
        <Divider />
        <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
          <ListCard cord={`${Kind.Contacts}:${pubkey}`} />
          <ListCard cord={`${MUTE_LIST_KIND}:${pubkey}`} />
          <ListCard cord={`${PIN_LIST_KIND}:${pubkey}`} />
        </SimpleGrid>

        {peopleLists.length > 0 && (
          <>
            <Heading size="md" mt="2">
              People lists
            </Heading>
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
            <Heading size="md" mt="2">
              Bookmark lists
            </Heading>
            <Divider />
            <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
              {noteLists.map((event) => (
                <ListCard key={getEventUID(event)} event={event} />
              ))}
            </SimpleGrid>
          </>
        )}
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
