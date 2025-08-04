import { Table, TableContainer, Tbody, Th, Thead, Tr } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useCallback } from "react";

import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import TimelineActionAndStatus from "../../../components/timeline/timeline-action-and-status";
import { TORRENT_KIND, validateTorrent } from "../../../helpers/nostr/torrents";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import TorrentTableRow from "../../torrents/components/torrent-table-row";

export default function UserTorrentsTab() {
  const user = useParamsProfilePointer("pubkey");
  const mailboxes = useUserMailboxes(user);
  const readRelays = useReadRelays();

  const eventFilter = useCallback((t: NostrEvent) => validateTorrent(t), []);
  const { loader, timeline: torrents } = useTimelineLoader(
    `${user.pubkey}-torrents`,
    mailboxes?.outboxes || readRelays,
    {
      authors: [user.pubkey],
      kinds: [TORRENT_KIND],
    },
    { eventFilter },
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <ScrollLayout>
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
              {torrents?.map((torrent) => (
                <TorrentTableRow key={torrent.id} torrent={torrent} />
              ))}
            </Tbody>
          </Table>
        </TableContainer>

        <TimelineActionAndStatus loader={loader} />
      </IntersectionObserverProvider>
    </ScrollLayout>
  );
}
