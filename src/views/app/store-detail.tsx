import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Divider,
  Flex,
  Heading,
  SimpleGrid,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";

import GenericCommentForm from "../../components/comment/generic-comment-form";
import { GenericComments } from "../../components/comment/generic-comments";
import { ErrorBoundary } from "../../components/error-boundary";
import { ThreadIcon } from "../../components/icons";
import SimpleView from "../../components/layout/presets/simple-view";
import NappletInstallModal from "../../components/napplets/napplet-install-modal";
import NappletMenu from "../../components/napplets/napplet-menu";
import NappletSourceButton from "../../components/napplets/napplet-source-button";
import EventQuoteButton from "../../components/note/event-quote-button";
import Timestamp from "../../components/timestamp";
import EventShareButton from "../../components/timeline/note/components/event-share-button";
import NoteReactions from "../../components/timeline/note/components/note-reactions";
import NappletIconImage from "../../components/napplets/napplet-icon";
import UserLink from "../../components/user/user-link";
import UserName from "../../components/user/user-name";
import EventZapButton from "../../components/zap/event-zap-button";
import {
  NAPPLET_KIND_NAMED,
  NAPPLET_KIND_ROOT,
  getConventionAction,
  getNappletArchetypes,
  getNappletDescription,
  getNappletEventPointer,
  getNappletNaddr,
  getNappletRequiredCapabilities,
  getNappletTitle,
  getUnsupportedNappletRequirements,
  isNappletManifestKind,
  parseNappletPointer,
  validateNappletManifest,
} from "../../helpers/nostr/napplets";
import { useReadRelays } from "../../hooks/use-client-relays";
import useEvent from "../../hooks/use-event";
import useInstalledNapplets from "../../hooks/use-installed-napplets";
import useRouteSearchValue from "../../hooks/use-route-search-value";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { uninstallNapplet } from "../../services/installed-napplets";
import { eventDeleteManager } from "../../services/event-store";
import NappletDetailAdvanced from "../napplets/components/napplet-detail-advanced";
import NappletDetailPermissions from "../napplets/components/napplet-detail-permissions";
import NappletDetailStorage from "../napplets/components/napplet-detail-storage";

const RELATED_NAPPLETS_LIMIT = 6;
const BASE_TABS = ["details", "comments", "advanced"];

function RelatedNappletCard({ event }: { event: NostrEvent }) {
  const address = getNappletNaddr(event);
  if (!address) return null;

  return (
    <Box
      as={RouterLink}
      to={`/app/store/${address}`}
      display="block"
      borderRadius="md"
      p="2"
      _hover={{ textDecoration: "none", bg: "blackAlpha.50", _dark: { bg: "whiteAlpha.100" } }}
    >
      <Heading size="sm" noOfLines={1} mb="1">
        {getNappletTitle(event)}
      </Heading>
      <Text color="GrayText" fontSize="sm" noOfLines={2} mb="2">
        {getNappletDescription(event) || "No description provided."}
      </Text>
      <Flex gap="1" wrap="wrap">
        {getNappletArchetypes(event)
          .slice(0, 3)
          .map((archetype) => (
            <Badge key={archetype.name}>{archetype.name}</Badge>
          ))}
      </Flex>
    </Box>
  );
}

function RelatedNapplets({ event }: { event: NostrEvent }) {
  const relays = useReadRelays();
  const eventFilter = useMemo(
    () => (candidate: NostrEvent) => {
      return (
        candidate.id !== event.id &&
        isNappletManifestKind(candidate.kind) &&
        validateNappletManifest(candidate) &&
        !!getNappletNaddr(candidate)
      );
    },
    [event.id],
  );
  const { loader, timeline } = useTimelineLoader(
    `${event.pubkey}-related-napplets`,
    relays,
    { kinds: [NAPPLET_KIND_ROOT, NAPPLET_KIND_NAMED], authors: [event.pubkey], limit: RELATED_NAPPLETS_LIMIT + 1 },
    { eventFilter },
  );
  const related = timeline.slice(0, RELATED_NAPPLETS_LIMIT);

  useEffect(() => {
    const sub = loader?.({ since: 0, until: Math.floor(Date.now() / 1000) }).subscribe();
    return () => sub?.unsubscribe();
  }, [loader]);

  if (related.length === 0) return null;

  return (
    <Flex direction="column" gap="3">
      <Heading size="sm">More by this author</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="2">
        {related.map((napplet) => (
          <RelatedNappletCard key={napplet.id} event={napplet} />
        ))}
      </SimpleGrid>
    </Flex>
  );
}

function NappletStoreDetailPage({ event, address }: { event: NostrEvent; address: string }) {
  const comment = useDisclosure();
  const install = useDisclosure();
  const installed = useInstalledNapplets().some((napplet) => napplet.address === address);
  const title = getNappletTitle(event);
  const description = getNappletDescription(event);
  const archetypes = getNappletArchetypes(event);
  const unsupported = getUnsupportedNappletRequirements(event);
  const naddr = getNappletNaddr(event);
  const hasPermissions = getNappletRequiredCapabilities(event).length > 0;
  const tabs = [
    ...BASE_TABS,
    ...(installed && hasPermissions ? ["permissions"] : []),
    ...(installed ? ["storage"] : []),
  ];
  const tab = useRouteSearchValue("tab", tabs[0]);
  const tabIndex = Math.max(0, tabs.indexOf(tab.value));

  return (
    <SimpleView
      title={
        <Text>
          {title} by <UserName pubkey={event.pubkey} />
        </Text>
      }
      actions={<NappletMenu event={event} variant="ghost" size="sm" ms="auto" />}
    >
      <Flex direction="column" gap="4" maxW="6xl" mx="auto" w="full">
        <Flex gap="4" alignItems="flex-start" wrap={{ base: "wrap", md: "nowrap" }}>
          <NappletIconImage event={event} boxSize="16" />
          <Flex direction="column" gap="2" flex="1" minW="0">
            <Heading size="lg">{title}</Heading>
            <Flex gap="2" color="GrayText" fontSize="sm" alignItems="center" wrap="wrap">
              <Text>
                By <UserLink pubkey={event.pubkey} color="inherit" />
              </Text>
              <Text>·</Text>
              <Timestamp timestamp={event.created_at} />
            </Flex>
            {description && <Text whiteSpace="pre-line">{description}</Text>}
          </Flex>
          <ButtonGroup flexShrink={0}>
            <Button as={RouterLink} to={`/app/${naddr || address}`} colorScheme="primary">
              Open
            </Button>
            <NappletSourceButton event={event} />
            <EventZapButton event={event} showEventPreview={false} variant="outline" />
            {installed ? (
              <Button variant="outline" onClick={() => uninstallNapplet(address)}>
                Uninstall
              </Button>
            ) : (
              <Button variant="outline" isDisabled={!naddr} onClick={install.onOpen}>
                Install
              </Button>
            )}
          </ButtonGroup>
        </Flex>

        <Tabs
          colorScheme="primary"
          variant="soft-rounded"
          isLazy
          index={tabIndex}
          onChange={(i) => (i === 0 ? tab.clearValue() : tab.setValue(tabs[i]))}
        >
          <TabList gap="2" flexWrap="wrap">
            <Tab>Details</Tab>
            <Tab>Comments</Tab>
            <Tab>Advanced</Tab>
            {installed && hasPermissions && <Tab>Permissions</Tab>}
            {installed && <Tab>Storage</Tab>}
          </TabList>
          <TabPanels>
            <TabPanel px="0">
              <Flex direction="column" gap="4">
                <Flex direction="column" gap="3">
                  <Heading size="sm">Supported intents</Heading>
                  {archetypes.length === 0 ? (
                    <Text color="GrayText">No archetypes declared.</Text>
                  ) : (
                    <Flex direction="column" gap="3">
                      {archetypes.map((archetype) => (
                        <Box key={archetype.name}>
                          <Heading size="xs" mb="1">
                            {archetype.name}
                          </Heading>
                          <Flex gap="1" wrap="wrap">
                            {archetype.contracts.map(({ convention, params }) => (
                              <Badge key={convention}>
                                {getConventionAction(convention)}
                                {params.length > 0 && ` (${params.join(", ")})`}
                              </Badge>
                            ))}
                          </Flex>
                        </Box>
                      ))}
                    </Flex>
                  )}
                </Flex>

                <Divider />

                {unsupported.length > 0 && (
                  <Alert status="warning">
                    <AlertIcon />
                    <AlertDescription>Unsupported requirements: {unsupported.join(", ")}</AlertDescription>
                  </Alert>
                )}

                <RelatedNapplets event={event} />

                <Divider />

                <Flex gap="2" wrap="wrap" alignItems="center">
                  <ButtonGroup size="sm" variant="ghost">
                    <EventShareButton event={event} />
                    <EventQuoteButton event={event} />
                  </ButtonGroup>
                  <NoteReactions event={event} size="sm" variant="ghost" />
                </Flex>
              </Flex>
            </TabPanel>
            <TabPanel px="0">
              <Flex maxW="4xl" w="full" gap="2" direction="column">
                {comment.isOpen ? (
                  <GenericCommentForm event={event} onCancel={comment.onClose} onSubmitted={comment.onClose} />
                ) : (
                  <Button leftIcon={<ThreadIcon />} onClick={comment.onOpen} mr="auto">
                    Comment
                  </Button>
                )}
                <GenericComments event={event} />
              </Flex>
            </TabPanel>
            <TabPanel px="0">
              <NappletDetailAdvanced event={event} />
            </TabPanel>
            {installed && hasPermissions && (
              <TabPanel px="0">
                <NappletDetailPermissions event={event} />
              </TabPanel>
            )}
            {installed && (
              <TabPanel px="0">
                <NappletDetailStorage event={event} />
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
      </Flex>
      {naddr && install.isOpen && <NappletInstallModal event={event} isOpen onClose={install.onClose} />}
    </SimpleView>
  );
}

function NappletStoreDetailView() {
  const { address } = useParams<{ address: string }>();
  const pointer = useMemo(() => (address ? parseNappletPointer(address) : undefined), [address]);
  const eventPointer = useMemo(() => (pointer ? getNappletEventPointer(pointer) : undefined), [pointer]);
  const event: NostrEvent | undefined = useEvent(eventPointer);
  const [lastLoaded, setLastLoaded] = useState<{ address: string; event: NostrEvent }>();

  useEffect(() => {
    if (address && event) setLastLoaded({ address, event });
  }, [address, event]);

  if (!address || !pointer || !eventPointer) {
    return (
      <SimpleView title="App not found">
        <Alert status="error">
          <AlertIcon />
          <AlertDescription>Invalid app pointer.</AlertDescription>
        </Alert>
      </SimpleView>
    );
  }

  if (!event) {
    if (lastLoaded?.address === address && eventDeleteManager.check(lastLoaded.event)) {
      return (
        <SimpleView title={getNappletTitle(lastLoaded.event)}>
          <Alert status="info">
            <AlertIcon />
            <AlertDescription>This napplet manifest has been deleted.</AlertDescription>
          </Alert>
        </SimpleView>
      );
    }
    return <Spinner />;
  }

  if (!isNappletManifestKind(event.kind) || !validateNappletManifest(event)) {
    return (
      <SimpleView title="App not found">
        <Alert status="warning">
          <AlertIcon />
          <AlertDescription>
            Loaded event kind {event.kind}, but it is not a valid NIP-5D app manifest.
          </AlertDescription>
        </Alert>
      </SimpleView>
    );
  }

  return <NappletStoreDetailPage event={event} address={getNappletNaddr(event) || address} />;
}

export default function NappletStoreDetail() {
  return (
    <ErrorBoundary>
      <NappletStoreDetailView />
    </ErrorBoundary>
  );
}
