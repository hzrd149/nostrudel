import { Table, TableContainer, Tbody, Th, Thead, Tr } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import { useCallback } from "react";

import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import useSubject from "../../hooks/use-subject";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { TORRENT_KIND, validateTorrent } from "../../helpers/nostr/torrents";
import TorrentTableRow from "../torrents/components/torrent-table-row";
import { NostrEvent } from "../../types/nostr-event";

export default function UserTorrentsTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contextRelays = useAdditionalRelayContext();

  const eventFilter = useCallback((t: NostrEvent) => validateTorrent(t), []);
  const timeline = useTimelineLoader(
    `${pubkey}-torrents`,
    contextRelays,
    {
      authors: [pubkey],
      kinds: [TORRENT_KIND],
    },
    { eventFilter },
  );

  const torrents = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
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

        <TimelineActionAndStatus timeline={timeline} />
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
