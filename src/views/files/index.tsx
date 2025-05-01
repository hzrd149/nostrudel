import {
  Box,
  ButtonGroup,
  Card,
  CardFooter,
  CardHeader,
  CardProps,
  Flex,
  Heading,
  LinkBox,
  Text,
} from "@chakra-ui/react";
import { getTagValue } from "applesauce-core/helpers";
import { memo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { getFileMetadata } from "applesauce-core/helpers/file-metadata";

import { NostrEvent } from "nostr-tools";
import { ErrorBoundary } from "../../components/error-boundary";
import HoverLinkOverlay from "../../components/hover-link-overlay";
import SimpleView from "../../components/layout/presets/simple-view";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import Timestamp from "../../components/timestamp";
import { UserAvatarLink } from "../../components/user/user-avatar-link";
import UserDnsIdentityIcon from "../../components/user/user-dns-identity-icon";
import UserLink from "../../components/user/user-link";
import { FILE_KIND, IMAGE_TYPES } from "../../helpers/nostr/files";
import { formatBytes } from "../../helpers/number";
import { useReadRelays } from "../../hooks/use-client-relays";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import { useVirtualListScrollRestore } from "../../hooks/use-scroll-restore";
import useShareableEventAddress from "../../hooks/use-shareable-event-address";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import MimeTypePicker from "./mime-type-picker";

const FileCard = memo(({ file, ...props }: { file: NostrEvent } & Omit<CardProps, "children">) => {
  const ref = useEventIntersectionRef<HTMLDivElement>(file);
  const name = getTagValue(file, "name") || getTagValue(file, "summary") || "Unknown";
  const type = getTagValue(file, "m");
  const size = getTagValue(file, "size");
  const nevent = useShareableEventAddress(file);

  return (
    <Card as={LinkBox} ref={ref} {...props}>
      <CardHeader p="4">
        <Heading size="md">
          <HoverLinkOverlay as={RouterLink} to={`/files/${nevent}`}>
            {name}
          </HoverLinkOverlay>
        </Heading>
        <Flex gap="2" alignItems="center">
          <UserAvatarLink size="xs" pubkey={file.pubkey} />
          <UserLink pubkey={file.pubkey} />
          <UserDnsIdentityIcon pubkey={file.pubkey} />
        </Flex>
      </CardHeader>
      <CardFooter p="4" pt="0">
        <Flex justifyContent="space-between" w="full">
          <Text color="gray.600">
            {type} • {size && formatBytes(parseInt(size))}
          </Text>
          <Timestamp timestamp={file.created_at} />
        </Flex>
      </CardFooter>
    </Card>
  );
});

function FileRow({ index, style, data }: ListChildComponentProps<NostrEvent[]>) {
  return (
    <Box style={style} pb="2">
      <ErrorBoundary>
        <FileCard file={data[index]} h="full" mx="auto" maxW="6xl" w="full" />
      </ErrorBoundary>
    </Box>
  );
}

function FilesHomePage() {
  const { listId, filter } = usePeopleListContext();
  const relays = useReadRelays();
  const scroll = useVirtualListScrollRestore("manual");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(IMAGE_TYPES);

  const { loader, timeline: files } = useTimelineLoader(
    `${listId}-files`,
    relays,
    selectedTypes.length > 0 && !!filter ? { kinds: [FILE_KIND], "#m": selectedTypes, ...filter } : undefined,
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      <SimpleView
        title="Files"
        scroll={false}
        actions={
          <ButtonGroup ms="auto">
            <PeopleListSelection />
            <MimeTypePicker selected={selectedTypes} onChange={(v) => setSelectedTypes(v)} />
          </ButtonGroup>
        }
        flush
      >
        <AutoSizer>
          {({ height, width }) => (
            <List itemCount={files.length} itemSize={120} itemData={files} width={width} height={height} {...scroll}>
              {FileRow}
            </List>
          )}
        </AutoSizer>
      </SimpleView>
    </IntersectionObserverProvider>
  );
}

export default function FilesHomeView() {
  return (
    <PeopleListProvider>
      <FilesHomePage />
    </PeopleListProvider>
  );
}
