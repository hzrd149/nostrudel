import { useCallback, useState } from "react";
import { Flex, Select, SimpleGrid, Switch, useDisclosure } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { getEventPointersFromList } from "applesauce-core/helpers";

import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { getEventUID } from "../../helpers/nostr/event";
import { getListName, getPubkeysFromList } from "../../helpers/nostr/lists";
import { useReadRelays } from "../../hooks/use-client-relays";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import { NostrEvent } from "nostr-tools";
import ListCard from "./components/list-card";

function BrowseListPage() {
  const { filter, listId } = usePeopleListContext();
  const showEmpty = useDisclosure();
  const showMute = useDisclosure();
  const [listKind, setListKind] = useState(kinds.Followsets);

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (event.kind !== listKind) return false;
      if (!showEmpty.isOpen && getPubkeysFromList(event).length === 0 && getEventPointersFromList(event).length === 0)
        return false;

      if (
        (!showMute.isOpen && event.kind === kinds.Followsets && getListName(event) === "mute") ||
        event.kind === kinds.Mutelist
      )
        return false;
      return true;
    },
    [showEmpty.isOpen, showMute.isOpen, listKind],
  );
  const readRelays = useReadRelays();
  const { loader, timeline: lists } = useTimelineLoader(
    `${listId}-lists`,
    readRelays,
    filter ? { ...filter, kinds: [kinds.Followsets, kinds.Genericlists, kinds.Bookmarksets] } : undefined,
    { eventFilter },
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <Flex gap="2" alignItems="center" wrap="wrap">
          <PeopleListSelection />
          <Select w="sm" value={listKind} onChange={(e) => setListKind(parseInt(e.target.value))}>
            <option value={kinds.Followsets}>People list</option>
            <option value={kinds.Genericlists}>Note list</option>
            <option value={kinds.Bookmarksets}>Bookmark sets</option>
          </Select>
          <Switch isChecked={showEmpty.isOpen} onChange={showEmpty.onToggle} whiteSpace="pre">
            Show Empty
          </Switch>
          <Switch isChecked={showMute.isOpen} onChange={showMute.onToggle} whiteSpace="pre">
            Show Mute
          </Switch>
        </Flex>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="2">
          {lists?.map((event) => <ListCard key={getEventUID(event)} list={event} />)}
        </SimpleGrid>
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}

export default function BrowseListView() {
  return (
    <PeopleListProvider>
      <BrowseListPage />
    </PeopleListProvider>
  );
}
