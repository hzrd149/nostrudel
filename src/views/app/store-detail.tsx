import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Code,
  Divider,
  Flex,
  Heading,
  Link,
  SimpleGrid,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { ReactNode, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";

import GenericCommentForm from "../../components/comment/generic-comment-form";
import { GenericComments } from "../../components/comment/generic-comments";
import { ErrorBoundary } from "../../components/error-boundary";
import { ThreadIcon } from "../../components/icons";
import SimpleView from "../../components/layout/presets/simple-view";
import EventQuoteButton from "../../components/note/event-quote-button";
import Timestamp from "../../components/timestamp";
import EventShareButton from "../../components/timeline/note/components/event-share-button";
import NoteReactions from "../../components/timeline/note/components/note-reactions";
import UserAvatar from "../../components/user/user-avatar";
import UserName from "../../components/user/user-name";
import EventZapButton from "../../components/zap/event-zap-button";
import {
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
import useEvent from "../../hooks/use-event";
import { getInstalledNapplet, installNapplet, uninstallNapplet } from "../../services/installed-napplets";

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Text color="GrayText" fontSize="sm">
        {label}
      </Text>
      {children}
    </Box>
  );
}

function NappletStoreDetailPage({ event, address }: { event: NostrEvent; address: string }) {
  const comment = useDisclosure();
  const [installed, setInstalled] = useState(() => !!getInstalledNapplet(address));
  const title = getNappletTitle(event);
  const description = getNappletDescription(event);
  const archetypes = getNappletArchetypes(event);
  const capabilities = getNappletRequiredCapabilities(event);
  const unsupported = getUnsupportedNappletRequirements(event);
  const naddr = getNappletNaddr(event);

  return (
    <SimpleView
      title={
        <Text>
          {title} by <UserName pubkey={event.pubkey} />
        </Text>
      }
      actions={
        <ButtonGroup variant="ghost" size="sm" ms="auto">
          <EventShareButton event={event} />
          <EventQuoteButton event={event} />
        </ButtonGroup>
      }
    >
      <Flex direction="column" gap="4" maxW="6xl" mx="auto" w="full">
        <Flex gap="4" alignItems="flex-start" wrap={{ base: "wrap", md: "nowrap" }}>
          <UserAvatar pubkey={event.pubkey} size="lg" />
          <Flex direction="column" gap="2" flex="1" minW="0">
            <Heading size="lg">{title}</Heading>
            <Flex gap="2" color="GrayText" fontSize="sm" alignItems="center" wrap="wrap">
              <Text>
                By <UserName pubkey={event.pubkey} />
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
            <EventZapButton event={event} showEventPreview={false} variant="outline" />
            {installed ? (
              <Button
                variant="outline"
                onClick={() => {
                  uninstallNapplet(address);
                  setInstalled(false);
                }}
              >
                Uninstall
              </Button>
            ) : (
              <Button
                variant="outline"
                isDisabled={!naddr}
                onClick={() => {
                  installNapplet(event, naddr);
                  setInstalled(true);
                }}
              >
                Install
              </Button>
            )}
          </ButtonGroup>
        </Flex>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="3">
          <Card variant="outline">
            <CardBody display="flex" flexDirection="column" gap="3">
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
                        {archetype.actions.map((action) => (
                          <Badge key={action}>{action}</Badge>
                        ))}
                      </Flex>
                    </Box>
                  ))}
                </Flex>
              )}
            </CardBody>
          </Card>

          <Card variant="outline">
            <CardBody display="flex" flexDirection="column" gap="3">
              <Heading size="sm">Details</Heading>
              <DetailRow label="Kind">
                <Text>{event.kind}</Text>
              </DetailRow>
              <DetailRow label="Manifest pointer">
                <Code userSelect="all" whiteSpace="normal">
                  {naddr || address}
                </Code>
              </DetailRow>
              <DetailRow label="Author">
                <Link as={RouterLink} to={`/u/${event.pubkey}`}>
                  <UserName pubkey={event.pubkey} />
                </Link>
              </DetailRow>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card variant="outline">
          <CardBody display="flex" flexDirection="column" gap="3">
            <Heading size="sm">Capabilities</Heading>
            {capabilities.length === 0 ? (
              <Text color="GrayText">No shell capabilities requested.</Text>
            ) : (
              <Flex gap="1" wrap="wrap">
                {capabilities.map((capability) => (
                  <Badge key={capability} colorScheme="primary">
                    {capability}
                  </Badge>
                ))}
              </Flex>
            )}
            {unsupported.length > 0 && (
              <Alert status="warning">
                <AlertIcon />
                <AlertDescription>Unsupported requirements: {unsupported.join(", ")}</AlertDescription>
              </Alert>
            )}
          </CardBody>
        </Card>

        <Divider />

        <Flex gap="2" wrap="wrap" alignItems="center">
          <ButtonGroup size="sm" variant="ghost">
            <EventShareButton event={event} />
            <EventQuoteButton event={event} />
          </ButtonGroup>
          <NoteReactions event={event} size="sm" variant="ghost" />
        </Flex>

        <Divider />

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
      </Flex>
    </SimpleView>
  );
}

function NappletStoreDetailView() {
  const { address } = useParams<{ address: string }>();
  const pointer = useMemo(() => (address ? parseNappletPointer(address) : undefined), [address]);
  const eventPointer = useMemo(() => (pointer ? getNappletEventPointer(pointer) : undefined), [pointer]);
  const event: NostrEvent | undefined = useEvent(eventPointer);

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

  if (!event) return <Spinner />;

  if (!isNappletManifestKind(event.kind) || !validateNappletManifest(event)) {
    return (
      <SimpleView title="App not found">
        <Alert status="warning">
          <AlertIcon />
          <AlertDescription>Loaded event kind {event.kind}, but it is not a valid NIP-5D app manifest.</AlertDescription>
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
