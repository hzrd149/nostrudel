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
import SimpleView from "../../../components/layout/presets/simple-view";
import EventQuoteButton from "../../../components/note/event-quote-button";
import EventShareButton from "../../../components/note/timeline-note/components/event-share-button";
import NoteReactions from "../../../components/note/timeline-note/components/note-reactions";
import BackButton from "../../../components/router/back-button";
import UserName from "../../../components/user/user-name";
import EventZapButton from "../../../components/zap/event-zap-button";
import { formatBytes } from "../../../helpers/number";
import useMaxPageWidth from "../../../hooks/use-max-page-width";
import useParamsEventPointer from "../../../hooks/use-params-event-pointer";
import useSingleEvent from "../../../hooks/use-single-event";
import { ContentSettingsProvider } from "../../../providers/local/content-settings";
import FileDownloadButton from "../components/download-button";
import FileMenu from "../components/file-menu";
import FilePreview from "./preview";

function FileDetailsPage({ file }: { file: NostrEvent }) {
  const name = getTagValue(file, "name");
  const summary = getTagValue(file, "summary");
  const magnet = getTagValue(file, "magnet");
  const type = getTagValue(file, "m");
  const size = getTagValue(file, "size");
  const sha256 = getTagValue(file, "x");
  const comment = useDisclosure();

  const maxWidth = useMaxPageWidth();

  return (
    <SimpleView
      title={
        <Text>
          {name || type || "File"} by <UserName pubkey={file.pubkey} />
        </Text>
      }
      actions={
        <ButtonGroup variant="ghost" size="sm" ms="auto">
          <EventShareButton event={file} />
          <EventQuoteButton event={file} />
          <FileMenu file={file} aria-label="More options" />
        </ButtonGroup>
      }
    >
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
        <ContentSettingsProvider event={file}>
          <FilePreview file={file} />
        </ContentSettingsProvider>
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
          <ButtonGroup size="sm" variant="ghost">
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
    </SimpleView>
  );
}

export default function FileDetailsView() {
  const pointer = useParamsEventPointer("nevent");
  const file = useSingleEvent(pointer);

  if (!file) return <Spinner />;

  return (
    <ErrorBoundary>
      <FileDetailsPage file={file} />
    </ErrorBoundary>
  );
}
