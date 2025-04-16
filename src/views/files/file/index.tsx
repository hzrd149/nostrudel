import {
  Box,
  Button,
  ButtonGroup,
  Code,
  Divider,
  Flex,
  Heading,
  Link,
  Spacer,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { getTagValue } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

import GenericCommentForm from "../../../components/comment/generic-comment-form";
import { GenericComments } from "../../../components/comment/generic-comments";
import { ErrorBoundary } from "../../../components/error-boundary";
import { ThreadIcon } from "../../../components/icons";
import Magnet from "../../../components/icons/magnet";
import EventQuoteButton from "../../../components/note/event-quote-button";
import EventShareButton from "../../../components/note/timeline-note/components/event-share-button";
import NoteReactions from "../../../components/note/timeline-note/components/note-reactions";
import BackButton from "../../../components/router/back-button";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import EventZapButton from "../../../components/zap/event-zap-button";
import { formatBytes } from "../../../helpers/number";
import useMaxPageWidth from "../../../hooks/use-max-page-width";
import useParamsEventPointer from "../../../hooks/use-params-event-pointer";
import useSingleEvent from "../../../hooks/use-single-event";
import { TrustProvider } from "../../../providers/local/trust-provider";
import FileDownloadButton from "../components/download-button";
import FileMenu from "../components/file-menu";
import FilePreview from "./preview";

function FileDetailsPage({ file }: { file: NostrEvent }) {
  const name = getTagValue(file, "name") || getTagValue(file, "x");
  const summary = getTagValue(file, "summary");
  const magnet = getTagValue(file, "magnet");
  const type = getTagValue(file, "m");
  const size = getTagValue(file, "size");
  const sha256 = getTagValue(file, "x");
  const comment = useDisclosure();

  const maxWidth = useMaxPageWidth();

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center">
        <BackButton variant="ghost" size="sm" />
        <Heading size="md" isTruncated>
          {name}
        </Heading>

        <ButtonGroup variant="ghost" size="sm" ms="auto">
          <EventShareButton event={file} />
          <EventQuoteButton event={file} />
          <FileMenu file={file} aria-label="More options" />
        </ButtonGroup>
      </Flex>

      <Flex
        direction="column"
        maxW={maxWidth}
        mx="auto"
        w="full"
        maxH="2xl"
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
      >
        <TrustProvider event={file}>
          <FilePreview file={file} />
        </TrustProvider>
      </Flex>

      <Flex mx="auto" maxW={maxWidth} w="full" gap="2" direction="column">
        <Flex gap="2">
          {type && <Text>{type}</Text>}
          {size && <Text>{formatBytes(parseInt(size))}</Text>}
        </Flex>

        {sha256 && (
          <Box>
            <Text>SHA-256 hash:</Text>
            <Code fontFamily="monospace" py="1" px="2" userSelect="all">
              {sha256}
            </Code>
          </Box>
        )}

        <Divider mx="auto" maxW={maxWidth} w="full" />
        {summary && <Text whiteSpace="pre-line">{summary}</Text>}
        <Flex gap="2" wrap="wrap">
          <ButtonGroup gap="2" size="sm" variant="ghost">
            <EventZapButton event={file} showEventPreview={false} />
            <EventShareButton event={file} />
            <EventQuoteButton event={file} />
          </ButtonGroup>
          <NoteReactions event={file} size="sm" variant="ghost" />
          <Spacer />
          {magnet && (
            <Button as={Link} variant="link" leftIcon={<Magnet />} href={magnet} isExternal p="2">
              magnet
            </Button>
          )}
          <FileDownloadButton file={file} colorScheme="primary" />
        </Flex>
      </Flex>

      <Flex mx="auto" maxW="4xl" w="full" gap="2" direction="column">
        {comment.isOpen ? (
          <GenericCommentForm event={file} onCancel={comment.onClose} onSubmitted={comment.onClose} />
        ) : (
          <Button leftIcon={<ThreadIcon />} onClick={comment.onOpen} mr="auto">
            Comment
          </Button>
        )}

        <GenericComments event={file} />
      </Flex>
    </VerticalPageLayout>
  );
}

export default function FileDetailsView() {
  const pointer = useParamsEventPointer("nevent");
  const file = useSingleEvent(pointer?.id, pointer?.relays ?? []);

  if (!file) return <Spinner />;

  return (
    <ErrorBoundary>
      <FileDetailsPage file={file} />
    </ErrorBoundary>
  );
}
