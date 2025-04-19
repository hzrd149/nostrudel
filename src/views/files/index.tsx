import { Flex, Link, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import { getTagValue } from "applesauce-core/helpers";
import { memo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { ErrorBoundary } from "../../components/error-boundary";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import Timestamp from "../../components/timestamp";
import { UserAvatarLink } from "../../components/user/user-avatar-link";
import UserDnsIdentityIcon from "../../components/user/user-dns-identity-icon";
import UserLink from "../../components/user/user-link";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { FILE_KIND, IMAGE_TYPES } from "../../helpers/nostr/files";
import { formatBytes } from "../../helpers/number";
import { useReadRelays } from "../../hooks/use-client-relays";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import useShareableEventAddress from "../../hooks/use-shareable-event-address";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import { NostrEvent } from "nostr-tools";
import MimeTypePicker from "./mime-type-picker";

const FileRow = memo(({ file }: { file: NostrEvent }) => {
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
      <Td>
        <Flex gap="2" alignItems="center">
          <UserAvatarLink size="xs" pubkey={file.pubkey} />
          <UserLink pubkey={file.pubkey} fontWeight="bold" />
          <UserDnsIdentityIcon pubkey={file.pubkey} />
        </Flex>
      </Td>
      <Td>{type}</Td>
      <Td>{size && formatBytes(parseInt(size))}</Td>
      <Td isNumeric>
        <Timestamp timestamp={file.created_at} />
      </Td>
    </Tr>
  );
});

function FilesHomePage() {
  const { listId, filter } = usePeopleListContext();
  const relays = useReadRelays();

  const [selectedTypes, setSelectedTypes] = useState<string[]>(IMAGE_TYPES);

  const { loader, timeline: files } = useTimelineLoader(
    `${listId}-files`,
    relays,
    selectedTypes.length > 0 && !!filter ? { kinds: [FILE_KIND], "#m": selectedTypes, ...filter } : undefined,
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <VerticalPageLayout>
      <Flex gap="2">
        <PeopleListSelection />
        <MimeTypePicker selected={selectedTypes} onChange={(v) => setSelectedTypes(v)} />
      </Flex>

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
                <ErrorBoundary key={file.id} event={file}>
                  <FileRow file={file} />
                </ErrorBoundary>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </IntersectionObserverProvider>
      <TimelineActionAndStatus loader={loader} />
    </VerticalPageLayout>
  );
}

export default function FilesHomeView() {
  return (
    <PeopleListProvider>
      <FilesHomePage />
    </PeopleListProvider>
  );
}
