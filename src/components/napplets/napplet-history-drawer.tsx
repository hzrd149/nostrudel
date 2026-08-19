import {
  Badge,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  DrawerProps,
  Flex,
  Spinner,
  Stack,
  StackDivider,
  Text,
} from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import ClockRewind from "../icons/clock-rewind";
import SeenOnRelaysButton from "../note/seen-on-relays-button";
import Timestamp from "../timestamp";
import { getNappletNaddr, getNappletTitle } from "../../helpers/nostr/napplets";
import useNappletHistory from "../../hooks/use-napplet-history";

type NappletHistoryDrawerProps = Omit<DrawerProps, "children"> & {
  /** The latest/canonical manifest event */
  event: NostrEvent;
  /** The version currently running in the iframe (same object as `event` until rewound) */
  active: NostrEvent;
  onSelect: (version: NostrEvent) => void;
};

function VersionRow({
  version,
  event,
  active,
  onSelect,
  onClose,
}: {
  version: NostrEvent;
  event: NostrEvent;
  active: NostrEvent;
  onSelect: (version: NostrEvent) => void;
  onClose: () => void;
}) {
  const isLatest = version.id === event.id;
  const isActive = version.id === active.id;

  return (
    <Flex gap="2" alignItems="center" py="2" minW="0">
      <Timestamp timestamp={version.created_at} fontWeight="bold" fontSize="sm" flexShrink={0} />
      <Text fontFamily="monospace" fontSize="xs" color="GrayText" flexShrink={0}>
        {version.id.slice(0, 8)}
      </Text>
      <SeenOnRelaysButton event={version} size="xs" variant="ghost" />
      {isLatest && (
        <Badge colorScheme="green" flexShrink={0} fontSize="xs">
          Latest
        </Badge>
      )}
      {isActive && (
        <Badge colorScheme="blue" flexShrink={0} fontSize="xs">
          Viewing
        </Badge>
      )}
      {!isActive && (
        <Button
          ml="auto"
          size="sm"
          colorScheme="primary"
          flexShrink={0}
          onClick={() => {
            onSelect(version);
            onClose();
          }}
        >
          Load
        </Button>
      )}
    </Flex>
  );
}

/** Right-side drawer listing every historical version of a napplet's coordinate, newest first. */
export default function NappletHistoryDrawer({
  event,
  active,
  onSelect,
  onClose,
  isOpen,
  ...props
}: NappletHistoryDrawerProps) {
  // The drawer stays mounted so it keeps its results across open/close, but the relay query
  // must not run for every napplet the user merely views — only once they ask for the history.
  const [everOpened, setEverOpened] = useState(false);
  useEffect(() => {
    if (isOpen) setEverOpened(true);
  }, [isOpen]);

  // `isOpen || everOpened` (not `everOpened` alone) so the query starts on the same render the
  // drawer opens, instead of flashing the empty state for one frame before the effect lands.
  const { versions } = useNappletHistory(isOpen || everOpened ? event : undefined);
  const address = getNappletNaddr(event);

  const loading = versions === undefined;
  const events = versions ?? [];

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md" {...props}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader px="2" pt="2" pb="0">
          <Flex alignItems="center" gap="2">
            <ClockRewind boxSize="6" /> Version history
          </Flex>
          <Text fontSize="sm" color="GrayText" fontWeight="normal">
            {getNappletTitle(event)}
          </Text>
        </DrawerHeader>

        <DrawerBody p="2" overflowX="hidden" overflowY="auto">
          <Text fontSize="sm" color="GrayText" isTruncated>
            {address ?? "This napplet has no coordinate address"}
          </Text>

          {address && (
            <Button as={RouterLink} to={`/app/store/${address}`} variant="ghost" size="sm" mt="2">
              App details
            </Button>
          )}

          {loading && (
            <Flex justifyContent="center" py="8" gap="2" alignItems="center">
              <Spinner /> Searching relays for older versions…
            </Flex>
          )}

          {!loading && events.length === 0 && (
            <Flex direction="column" alignItems="center" py="8" gap="1">
              <Text color="GrayText">No other versions found.</Text>
              <Text color="GrayText" fontSize="sm" textAlign="center">
                Most relays only keep the newest version of a replaceable event.
              </Text>
            </Flex>
          )}

          <Stack divider={<StackDivider />} spacing="0" mt="2">
            {events.map((version) => (
              <VersionRow
                key={version.id}
                version={version}
                event={event}
                active={active}
                onSelect={onSelect}
                onClose={onClose}
              />
            ))}
          </Stack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
