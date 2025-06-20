import { Link, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import { getTagValue } from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { Link as RouterLink, useOutletContext } from "react-router-dom";

import SimpleView from "../../components/layout/presets/simple-view";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import Timestamp from "../../components/timestamp";
import { formatBytes } from "../../helpers/number";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import useShareableEventAddress from "../../hooks/use-shareable-event-address";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";

function FileRow({ file }: { file: NostrEvent }) {
  const ref = useEventIntersectionRef<HTMLTableRowElement>(file);
  const name = getTagValue(file, "name") || getTagValue(file, "summary") || "Unknown";
  const type = getTagValue(file, "m");
  const size = getTagValue(file, "size");

  const nevent = useShareableEventAddress(file);

  return (
    <Tr ref={ref}>
      <Td maxW="xs">
        <Link as={RouterLink} to={`/files/${nevent}`}>
          {name}
        </Link>
      </Td>
      <Td>{type}</Td>
      <Td>{size && formatBytes(parseInt(size))}</Td>
      <Td isNumeric>
        <Timestamp timestamp={file.created_at} />
      </Td>
    </Tr>
  );
}

export default function UserFilesTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const { loader, timeline: files } = useTimelineLoader(pubkey + "-files", readRelays, [
    {
      authors: [pubkey],
      kinds: [kinds.FileMetadata],
    },
  ]);
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <SimpleView title="Files">
      <IntersectionObserverProvider callback={callback}>
        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Size</Th>
                <Th isNumeric>Created</Th>
              </Tr>
            </Thead>
            <Tbody>
              {files.map((file) => (
                <FileRow key={file.id} file={file} />
              ))}
            </Tbody>
          </Table>
        </TableContainer>
        <TimelineActionAndStatus loader={loader} />
      </IntersectionObserverProvider>
    </SimpleView>
  );
}
