import { Flex, Select, SimpleGrid, Switch, useDisclosure } from "@chakra-ui/react";

import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelays } from "../../hooks/use-client-relays";
import {
  MUTE_LIST_KIND,
  NOTE_LIST_KIND,
  PEOPLE_LIST_KIND,
  getEventPointersFromList,
  getListName,
  getPubkeysFromList,
} from "../../helpers/nostr/lists";
import { useCallback, useState } from "react";
import { NostrEvent } from "../../types/nostr-event";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useSubject from "../../hooks/use-subject";
import ListCard from "./components/list-card";
import { getEventUID } from "../../helpers/nostr/events";
import VerticalPageLayout from "../../components/vertical-page-layout";

function BrowseListPage() {
  const { filter, listId } = usePeopleListContext();
  const showEmpty = useDisclosure();
  const showMute = useDisclosure();
  const [listKind, setListKind] = useState(PEOPLE_LIST_KIND);

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (event.kind !== listKind) return false;
      if (!showEmpty.isOpen && getPubkeysFromList(event).length === 0 && getEventPointersFromList(event).length === 0)
        return false;

      if (
        (!showMute.isOpen && event.kind === PEOPLE_LIST_KIND && getListName(event) === "mute") ||
        event.kind === MUTE_LIST_KIND
      )
        return false;
      return true;
    },
    [showEmpty.isOpen, showMute.isOpen, listKind],
  );
  const readRelays = useReadRelays();
  const timeline = useTimelineLoader(
    `${listId}-lists`,
    readRelays,
    filter ? { ...filter, kinds: [PEOPLE_LIST_KIND, NOTE_LIST_KIND] } : undefined,
    { eventFilter },
  );

  const lists = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <Flex gap="2" alignItems="center" wrap="wrap">
          <PeopleListSelection />
          <Select w="sm" value={listKind} onChange={(e) => setListKind(parseInt(e.target.value))}>
            <option value={PEOPLE_LIST_KIND}>People List</option>
            <option value={NOTE_LIST_KIND}>Note List</option>
          </Select>
          <Switch isChecked={showEmpty.isOpen} onChange={showEmpty.onToggle} whiteSpace="pre">
            Show Empty
          </Switch>
          <Switch isChecked={showMute.isOpen} onChange={showMute.onToggle} whiteSpace="pre">
            Show Mute
          </Switch>
        </Flex>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="2">
          {lists.map((event) => (
            <ListCard key={getEventUID(event)} list={event} />
          ))}
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
