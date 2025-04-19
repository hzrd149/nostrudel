import { useCallback } from "react";
import { Flex, SimpleGrid, Switch, useDisclosure } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";
import { getEmojis } from "applesauce-core/helpers/emoji";
import { kinds } from "nostr-tools";

import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelays } from "../../hooks/use-client-relays";
import { NostrEvent } from "nostr-tools";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import EmojiPackCard from "./components/emoji-pack-card";
import VerticalPageLayout from "../../components/vertical-page-layout";

function EmojiPacksBrowsePage() {
  const { filter, listId } = usePeopleListContext();
  const showEmpty = useDisclosure();

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!showEmpty.isOpen && getEmojis(event).length === 0) return false;
      return true;
    },
    [showEmpty.isOpen],
  );
  const readRelays = useReadRelays();
  const { loader, timeline: packs } = useTimelineLoader(
    `${listId}-browse-emoji-packs`,
    readRelays,
    filter ? { ...filter, kinds: [kinds.Emojisets] } : undefined,
    { eventFilter },
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <Flex gap="2" alignItems="center" wrap="wrap">
          <PeopleListSelection />
          <Switch isChecked={showEmpty.isOpen} onChange={showEmpty.onToggle} whiteSpace="pre">
            Show Empty
          </Switch>
        </Flex>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="2">
          {packs?.map((event) => <EmojiPackCard key={getEventUID(event)} pack={event} />)}
        </SimpleGrid>
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}

export default function EmojiPacksBrowseView() {
  return (
    <PeopleListProvider>
      <EmojiPacksBrowsePage />
    </PeopleListProvider>
  );
}
