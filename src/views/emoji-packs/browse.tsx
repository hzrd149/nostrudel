import { useCallback } from "react";
import { Flex, SimpleGrid, Switch, useDisclosure } from "@chakra-ui/react";

import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelays } from "../../hooks/use-client-relays";
import { NostrEvent } from "../../types/nostr-event";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useSubject from "../../hooks/use-subject";
import EmojiPackCard from "./components/emoji-pack-card";
import { getEventUID } from "../../helpers/nostr/event";
import { EMOJI_PACK_KIND, getEmojisFromPack } from "../../helpers/nostr/emoji-packs";
import VerticalPageLayout from "../../components/vertical-page-layout";

function EmojiPacksBrowsePage() {
  const { filter, listId } = usePeopleListContext();
  const showEmpty = useDisclosure();

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!showEmpty.isOpen && getEmojisFromPack(event).length === 0) return false;
      return true;
    },
    [showEmpty.isOpen],
  );
  const readRelays = useReadRelays();
  const timeline = useTimelineLoader(
    `${listId}-browse-emoji-packs`,
    readRelays,
    filter ? { ...filter, kinds: [EMOJI_PACK_KIND] } : undefined,
    { eventFilter },
  );

  const packs = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

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
          {packs.map((event) => (
            <EmojiPackCard key={getEventUID(event)} pack={event} />
          ))}
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
