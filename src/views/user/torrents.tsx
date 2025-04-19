import { Table, TableContainer, Tbody, Th, Thead, Tr } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useCallback } from "react";
import { useOutletContext } from "react-router-dom";

import SimpleView from "../../components/layout/presets/simple-view";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import { TORRENT_KIND, validateTorrent } from "../../helpers/nostr/torrents";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import TorrentTableRow from "../torrents/components/torrent-table-row";

export default function UserTorrentsTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contextRelays = useAdditionalRelayContext();

  const eventFilter = useCallback((t: NostrEvent) => validateTorrent(t), []);
  const { loader, timeline: torrents } = useTimelineLoader(
    `${pubkey}-torrents`,
    contextRelays,
    {
      authors: [pubkey],
      kinds: [TORRENT_KIND],
    },
    { eventFilter },
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <SimpleView title="Torrents">
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
            <Tbody>{torrents?.map((torrent) => <TorrentTableRow key={torrent.id} torrent={torrent} />)}</Tbody>
          </Table>
        </TableContainer>

        <TimelineActionAndStatus loader={loader} />
      </IntersectionObserverProvider>
    </SimpleView>
  );
}
