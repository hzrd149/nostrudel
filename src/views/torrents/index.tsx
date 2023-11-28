import { useCallback } from "react";
import { Flex, Table, TableContainer, Tbody, Th, Thead, Tr } from "@chakra-ui/react";

import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import VerticalPageLayout from "../../components/vertical-page-layout";
import RelaySelectionProvider, { useRelaySelectionContext } from "../../providers/relay-selection-provider";
import PeopleListProvider, { usePeopleListContext } from "../../providers/people-list-provider";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { NostrEvent } from "../../types/nostr-event";
import { TORRENT_KIND, validateTorrent } from "../../helpers/nostr/torrents";
import useSubject from "../../hooks/use-subject";
import TorrentTableRow from "./components/torrent-table-row";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/intersection-observer";

function TorrentsPage() {
  const { filter, listId } = usePeopleListContext();
  const { relays } = useRelaySelectionContext();

  const muteFilter = useClientSideMuteFilter();

  const eventFilter = useCallback(
    (e: NostrEvent) => {
      return !muteFilter(e) && validateTorrent(e);
    },
    [muteFilter],
  );
  const timeline = useTimelineLoader(
    `${listId}-torrents`,
    relays,
    { ...filter, kinds: [TORRENT_KIND] },
    { eventFilter },
  );

  const torrents = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <VerticalPageLayout>
      <Flex gap="2">
        <RelaySelectionButton />
        <PeopleListSelection />
      </Flex>
      <IntersectionObserverProvider callback={callback}>
        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Tags</Th>
                <Th>Name</Th>
                <Th>Uploaded</Th>
                <Th>Size</Th>
                <Th>From</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {torrents.map((torrent) => (
                <TorrentTableRow key={torrent.id} torrent={torrent} />
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}

export default function TorrentsView() {
  return (
    <RelaySelectionProvider>
      <PeopleListProvider>
        <TorrentsPage />
      </PeopleListProvider>
    </RelaySelectionProvider>
  );
}
