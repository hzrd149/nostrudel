import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  Flex,
  Heading,
  Image,
  Link,
  Spacer,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { ErrorBoundary } from "../../components/error-boundary";
import SimpleView from "../../components/layout/presets/simple-view";
import GenericCommentForm from "../../components/comment/generic-comment-form";
import { GenericComments } from "../../components/comment/generic-comments";
import EventShareButton from "../../components/timeline/note/components/event-share-button";
import EventQuoteButton from "../../components/note/event-quote-button";
import NoteReactions from "../../components/timeline/note/components/note-reactions";
import EventZapButton from "../../components/zap/event-zap-button";
import UserName from "../../components/user/user-name";
import Timestamp from "../../components/timestamp";
import { ThreadIcon } from "../../components/icons";
import useParamsEventPointer from "../../hooks/use-params-event-pointer";
import useSingleEvent from "../../hooks/use-single-event";
import {
  getWebxdcHash,
  getWebxdcImage,
  getWebxdcName,
  getWebxdcSummary,
  getWebxdcUrl,
} from "../../helpers/nostr/webxdc";
import WebxdcPlayer from "./components/webxdc-player";

function WebxdcAppPage({ app }: { app: NostrEvent }) {
  const name = getWebxdcName(app);
  const summary = getWebxdcSummary(app);
  const image = getWebxdcImage(app);
  const appUrl = getWebxdcUrl(app);
  const sha256 = getWebxdcHash(app);
  const comment = useDisclosure();
  const play = useDisclosure({ defaultIsOpen: true });

  return (
    <SimpleView
      title={
        <Text>
          {name} by <UserName pubkey={app.pubkey} />
        </Text>
      }
      actions={
        <ButtonGroup variant="ghost" size="sm" ms="auto">
          <EventShareButton event={app} />
          <EventQuoteButton event={app} />
        </ButtonGroup>
      }
    >
      <Flex direction="column" gap="4" maxW="6xl" mx="auto" w="full">
        {/* App header */}
        <Flex gap="4" alignItems="flex-start">
          {image && (
            <Image src={image} alt={name} boxSize="80px" objectFit="contain" borderRadius="lg" flexShrink={0} />
          )}
          <Flex direction="column" gap="1" flex="1">
            <Heading size="lg">{name}</Heading>
            <Flex gap="2" color="gray.500" fontSize="sm" alignItems="center">
              <Text>
                By <UserName pubkey={app.pubkey} />
              </Text>
              <Text>•</Text>
              <Timestamp timestamp={app.created_at} />
            </Flex>
            {appUrl && (
              <Text fontSize="xs" color="gray.400" noOfLines={1}>
                <Link href={appUrl} isExternal color="blue.400">
                  {appUrl}
                </Link>
              </Text>
            )}
            {sha256 && (
              <Text fontSize="xs" color="gray.400" fontFamily="monospace" noOfLines={1}>
                SHA-256: {sha256}
              </Text>
            )}
          </Flex>
          <Button colorScheme={play.isOpen ? undefined : "primary"} onClick={play.onToggle} flexShrink={0}>
            {play.isOpen ? "Hide App" : "Launch App"}
          </Button>
        </Flex>

        {summary && (
          <Text whiteSpace="pre-line" color="gray.600">
            {summary}
          </Text>
        )}

        {/* The webxdc player */}
        {play.isOpen && (
          <Box borderRadius="lg" overflow="hidden" borderWidth="1px">
            <WebxdcPlayer event={app} height="600px" />
          </Box>
        )}

        <Divider />

        {/* Reactions and actions */}
        <Flex gap="2" wrap="wrap" alignItems="center">
          <ButtonGroup size="sm" variant="ghost">
            <EventZapButton event={app} showEventPreview={false} />
            <EventShareButton event={app} />
            <EventQuoteButton event={app} />
          </ButtonGroup>
          <NoteReactions event={app} size="sm" variant="ghost" />
          <Spacer />
        </Flex>

        <Divider />

        {/* Comments */}
        <Flex direction="column" gap="2">
          {comment.isOpen ? (
            <GenericCommentForm event={app} onCancel={comment.onClose} onSubmitted={comment.onClose} />
          ) : (
            <Button leftIcon={<ThreadIcon />} onClick={comment.onOpen} mr="auto" variant="ghost">
              Comment
            </Button>
          )}
          <GenericComments event={app} />
        </Flex>
      </Flex>
    </SimpleView>
  );
}

export default function WebxdcAppView() {
  const pointer = useParamsEventPointer("nevent");
  const app = useSingleEvent(pointer);

  if (!app) return <Spinner />;

  return (
    <ErrorBoundary>
      <WebxdcAppPage app={app} />
    </ErrorBoundary>
  );
}
