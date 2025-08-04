import { Link, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import { getTagValue } from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import TimelineActionAndStatus from "../../../components/timeline/timeline-action-and-status";
import Timestamp from "../../../components/timestamp";
import { formatBytes } from "../../../helpers/number";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import { useAdditionalRelayContext } from "../../../providers/local/additional-relay";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";

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
  const user = useParamsProfilePointer("pubkey");
  const readRelays = useAdditionalRelayContext();
  const mailboxes = useUserMailboxes(user);

  const { loader, timeline: files } = useTimelineLoader(user.pubkey + "-files", mailboxes?.outboxes || readRelays, [
    {
      authors: [user.pubkey],
      kinds: [kinds.FileMetadata],
    },
  ]);
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <ScrollLayout>
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
    </ScrollLayout>
  );
}
