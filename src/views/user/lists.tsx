import { useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { Divider, Heading, SimpleGrid } from "@chakra-ui/react";

import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import {
  BOOKMARK_LIST_KIND,
  MUTE_LIST_KIND,
  NOTE_LIST_KIND,
  PEOPLE_LIST_KIND,
  PIN_LIST_KIND,
  isJunkList,
} from "../../helpers/nostr/lists";
import { getEventUID } from "../../helpers/nostr/events";
import ListCard from "../lists/components/list-card";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { Kind } from "nostr-tools";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { NostrEvent } from "../../types/nostr-event";
import UserName from "../../components/user-name";

export default function UserListsTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const eventFilter = useCallback((event: NostrEvent) => {
    return !isJunkList(event);
  }, []);
  const timeline = useTimelineLoader(
    pubkey + "-lists",
    readRelays,
    [
      {
        authors: [pubkey],
        kinds: [PEOPLE_LIST_KIND, NOTE_LIST_KIND],
      },
      {
        "#p": [pubkey],
        kinds: [PEOPLE_LIST_KIND],
      },
    ],
    { eventFilter },
  );

  const lists = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  const peopleLists = lists.filter((event) => event.pubkey === pubkey && event.kind === PEOPLE_LIST_KIND);
  const noteLists = lists.filter((event) => event.pubkey === pubkey && event.kind === NOTE_LIST_KIND);
  const otherLists = lists.filter((event) => event.pubkey !== pubkey && event.kind === PEOPLE_LIST_KIND);

  return (
    <VerticalPageLayout>
      <IntersectionObserverProvider callback={callback}>
        <Heading size="md" mt="2">
          Special lists
        </Heading>
        <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
          <ListCard cord={`${Kind.Contacts}:${pubkey}`} hideCreator />
          <ListCard cord={`${MUTE_LIST_KIND}:${pubkey}`} hideCreator />
          <ListCard cord={`${PIN_LIST_KIND}:${pubkey}`} hideCreator />
          <ListCard cord={`${BOOKMARK_LIST_KIND}:${pubkey}`} hideCreator />
        </SimpleGrid>

        {peopleLists.length > 0 && (
          <>
            <Heading size="md" mt="2">
              People lists
            </Heading>
            <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
              {peopleLists.map((event) => (
                <ListCard key={getEventUID(event)} list={event} hideCreator />
              ))}
            </SimpleGrid>
          </>
        )}

        {noteLists.length > 0 && (
          <>
            <Heading size="md" mt="2">
              Bookmark lists
            </Heading>
            <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
              {noteLists.map((event) => (
                <ListCard key={getEventUID(event)} list={event} hideCreator />
              ))}
            </SimpleGrid>
          </>
        )}
      </IntersectionObserverProvider>

      <IntersectionObserverProvider callback={callback}>
        <Heading size="md" mt="2">
          Lists <UserName pubkey={pubkey} /> is in
        </Heading>
        <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
          {otherLists.map((event) => (
            <ListCard key={getEventUID(event)} list={event} />
          ))}
        </SimpleGrid>
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}
