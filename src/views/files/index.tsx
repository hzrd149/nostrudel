import { memo, useState } from "react";
import {
  Flex,
  Image,
  Link,
  SimpleGrid,
  Spacer,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { getTagValue } from "applesauce-core/helpers";

import useTimelineLoader from "../../hooks/use-timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import { FILE_KIND, IMAGE_TYPES, VIDEO_TYPES, getFileUrl, parseImageFile } from "../../helpers/nostr/files";
import { ErrorBoundary } from "../../components/error-boundary";
import useAppSettings from "../../hooks/use-user-app-settings";
import { TrustProvider, useTrustContext } from "../../providers/local/trust-provider";
import BlurredImage from "../../components/blured-image";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import { UserAvatarLink } from "../../components/user/user-avatar-link";
import UserLink from "../../components/user/user-link";
import MimeTypePicker from "./mime-type-picker";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import VerticalPageLayout from "../../components/vertical-page-layout";
import Timestamp from "../../components/timestamp";
import EventZapButton from "../../components/zap/event-zap-button";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { useReadRelays } from "../../hooks/use-client-relays";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import { formatBytes } from "../../helpers/number";
import UserDnsIdentityIcon from "../../components/user/user-dns-identity-icon";
import useShareableEventAddress from "../../hooks/use-shareable-event-address";

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
      <TimelineActionAndStatus timeline={loader} />
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
