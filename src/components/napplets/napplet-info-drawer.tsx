import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
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
  Heading,
  Spinner,
  Stack,
  StackDivider,
  Text,
} from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import GenericCommentForm from "../comment/generic-comment-form";
import { GenericComments } from "../comment/generic-comments";
import { ThreadIcon } from "../icons";
import ClockRewind from "../icons/clock-rewind";
import LayersThree01 from "../icons/layers-three-01";
import SeenOnRelaysButton from "../note/seen-on-relays-button";
import Timestamp from "../timestamp";
import UserName from "../user/user-name";
import NappletIconImage from "./napplet-icon";
import {
  NAPPLET_KIND_SNAPSHOT,
  getNappletDescription,
  getNappletNaddr,
  getNappletTitle,
} from "../../helpers/nostr/napplets";
import useNappletVersions from "../../hooks/use-napplet-versions";
import useUserContacts from "../../hooks/use-user-contacts";

type NappletInfoDrawerProps = Omit<DrawerProps, "children"> & {
  /** The latest/canonical manifest event — the napplet the drawer describes */
  event: NostrEvent;
  /** The release currently running in the iframe (same object as `event` until rewound) */
  active: NostrEvent;
  onSelect: (release: NostrEvent) => void;
};

/** One selectable release — a historical version or a snapshot. */
function ReleaseRow({
  release,
  event,
  active,
  onSelect,
  onClose,
}: {
  release: NostrEvent;
  event: NostrEvent;
  active: NostrEvent;
  onSelect: (release: NostrEvent) => void;
  onClose: () => void;
}) {
  const isLatest = release.id === event.id;
  const isActive = release.id === active.id;

  return (
    <Flex gap="2" alignItems="center" py="2" minW="0">
      <Timestamp timestamp={release.created_at} fontWeight="bold" fontSize="sm" flexShrink={0} />
      <Text fontFamily="monospace" fontSize="xs" color="GrayText" flexShrink={0}>
        {release.id.slice(0, 8)}
      </Text>
      <SeenOnRelaysButton event={release} size="xs" variant="ghost" />
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
            onSelect(release);
            onClose();
          }}
        >
          Load
        </Button>
      )}
    </Flex>
  );
}

/** An expandable accordion section listing releases — only rendered when there is a choice to make. */
function ReleaseSection({
  title,
  icon,
  releases,
  event,
  active,
  onSelect,
  onClose,
}: {
  title: string;
  icon: React.ReactNode;
  releases: NostrEvent[];
  event: NostrEvent;
  active: NostrEvent;
  onSelect: (release: NostrEvent) => void;
  onClose: () => void;
}) {
  return (
    <AccordionItem>
      <AccordionButton px="0">
        <Flex alignItems="center" gap="2" flexGrow={1}>
          {icon}
          <Heading size="sm">{title}</Heading>
          <Badge>{releases.length}</Badge>
        </Flex>
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel px="0" pt="0" pb="2">
        <Stack divider={<StackDivider />} spacing="0">
          {releases.map((release) => (
            <ReleaseRow
              key={release.id}
              release={release}
              event={event}
              active={active}
              onSelect={onSelect}
              onClose={onClose}
            />
          ))}
        </Stack>
      </AccordionPanel>
    </AccordionItem>
  );
}

/** Comments on the napplet from people the active account follows (and the account itself). */
function FriendComments({ event }: { event: NostrEvent }) {
  const account = useActiveAccount();
  const contacts = useUserContacts(account?.pubkey);

  const authors = useMemo(
    () => (account ? [account.pubkey, ...(contacts ?? []).map((c) => c.pubkey)] : undefined),
    [account, contacts],
  );

  return (
    <Flex direction="column" gap="2">
      {account && <GenericCommentForm event={event} simple />}
      <GenericComments
        event={event}
        authors={authors}
        empty={
          <Text fontSize="sm" color="GrayText">
            {account ? "None of your friends have commented yet." : "No comments yet."}
          </Text>
        }
      />
    </Flex>
  );
}

/** Right-side drawer describing the running napplet, with its version history and snapshots. */
export default function NappletInfoDrawer({
  event,
  active,
  onSelect,
  onClose,
  isOpen,
  ...props
}: NappletInfoDrawerProps) {
  // The drawer stays mounted so it keeps its results across open/close, but the relay query
  // must not run for every napplet the user merely views — only once they open the drawer.
  // `isOpen || everOpened` (not `everOpened` alone) so the query starts on the same render the
  // drawer opens, instead of flashing the empty state for one frame before the effect lands.
  const [everOpened, setEverOpened] = useState(false);
  useEffect(() => {
    if (isOpen) setEverOpened(true);
  }, [isOpen]);

  const { versions = [], snapshots = [], loading } = useNappletVersions(isOpen || everOpened ? event : undefined);

  // The drawer describes what is actually running, so metadata comes from the active release.
  const title = getNappletTitle(active);
  const description = getNappletDescription(active);
  const address = getNappletNaddr(event);

  // A single version is just "the napplet" — there is nothing to rewind between.
  const showHistory = versions.length > 1;
  const showSnapshots = snapshots.length > 1;

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md" {...props}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader px="3" pt="3" pb="2" pe="10">
          <Flex gap="3" alignItems="center" minW="0">
            <NappletIconImage event={active} boxSize="10" />
            <Heading size="md" noOfLines={2}>
              {title}
            </Heading>
          </Flex>
        </DrawerHeader>

        <DrawerBody px="3" pb="4" pt="0" overflowX="hidden" overflowY="auto">
          <Flex direction="column" gap="3">
            <Flex gap="2" alignItems="center" minW="0">
              <Flex direction="column" minW="0">
                <UserName pubkey={active.pubkey} fontWeight="bold" />
                <Text fontSize="sm" color="GrayText">
                  Updated <Timestamp timestamp={active.created_at} display="inline" />
                </Text>
              </Flex>
              {active.kind === NAPPLET_KIND_SNAPSHOT && (
                <Badge colorScheme="purple" ms="auto" flexShrink={0}>
                  Snapshot
                </Badge>
              )}
            </Flex>

            {description && (
              <Text whiteSpace="pre-line" fontSize="sm">
                {description}
              </Text>
            )}

            {address && (
              <Button as={RouterLink} to={`/app/store/${address}`} variant="outline" size="sm" mr="auto">
                App details
              </Button>
            )}

            {loading && (
              <Flex alignItems="center" gap="2" color="GrayText" fontSize="sm" py="2">
                <Spinner size="sm" /> Searching relays for other releases…
              </Flex>
            )}

            <Accordion allowMultiple>
              <AccordionItem>
                {({ isExpanded }) => (
                  <>
                    <AccordionButton px="0">
                      <Flex alignItems="center" gap="2" flexGrow={1}>
                        <ThreadIcon boxSize="5" />
                        <Heading size="sm">Friends' comments</Heading>
                      </Flex>
                      <AccordionIcon />
                    </AccordionButton>
                    {/* Only query relays for comments once the section is expanded */}
                    <AccordionPanel px="0" pt="0" pb="2">
                      {isExpanded && <FriendComments event={event} />}
                    </AccordionPanel>
                  </>
                )}
              </AccordionItem>
              {showHistory && (
                <ReleaseSection
                  title="Version history"
                  icon={<ClockRewind boxSize="5" />}
                  releases={versions}
                  event={event}
                  active={active}
                  onSelect={onSelect}
                  onClose={onClose}
                />
              )}
              {showSnapshots && (
                <ReleaseSection
                  title="Snapshots"
                  icon={<LayersThree01 boxSize="5" />}
                  releases={snapshots}
                  event={event}
                  active={active}
                  onSelect={onSelect}
                  onClose={onClose}
                />
              )}
            </Accordion>
          </Flex>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
