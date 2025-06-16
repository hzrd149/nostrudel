import {
  Button,
  ButtonGroup,
  Card,
  Flex,
  Heading,
  Link,
  Spinner,
  Table,
  TableContainer,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { ErrorBoundary } from "../../components/error-boundary";
import Magnet from "../../components/icons/magnet";
import MessageTextCircle01 from "../../components/icons/message-text-circle-01";
import EventQuoteButton from "../../components/note/event-quote-button";
import { TextNoteContents } from "../../components/note/timeline-note/text-note-contents";
import Timestamp from "../../components/timestamp";
import UserAvatarLink from "../../components/user/user-avatar-link";
import UserLink from "../../components/user/user-link";
import VerticalPageLayout from "../../components/vertical-page-layout";
import EventZapButton from "../../components/zap/event-zap-button";
import { getThreadReferences } from "../../helpers/nostr/event";
import {
  TORRENT_COMMENT_KIND,
  getTorrentFiles,
  getTorrentMagnetLink,
  getTorrentSize,
  getTorrentTitle,
} from "../../helpers/nostr/torrents";
import { formatBytes } from "../../helpers/number";
import useParamsEventPointer from "../../hooks/use-params-event-pointer";
import useSingleEvent from "../../hooks/use-single-event";
import ReplyForm from "../thread/components/reply-form";
import TorrentMenu from "./components/torrent-menu";
import TorrentComments from "./components/torrents-comments";

function TorrentDetailsPage({ torrent }: { torrent: NostrEvent }) {
  const files = getTorrentFiles(torrent);
  const replyForm = useDisclosure();

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center" wrap="wrap">
        <Flex as={Heading} size="md" gap="2" alignItems="center" wrap="wrap">
          <UserAvatarLink pubkey={torrent.pubkey} size="md" />
          <UserLink pubkey={torrent.pubkey} fontWeight="bold" />
          <Text> - </Text>
          <Text>{getTorrentTitle(torrent)}</Text>
        </Flex>
        <TorrentMenu torrent={torrent} ml="auto" aria-label="More Options" />
      </Flex>
      <Card p="2" display="flex" gap="2" flexDirection="column" alignItems="flex-start">
        <Text>Size: {formatBytes(getTorrentSize(torrent))}</Text>
        <Text>
          Uploaded: <Timestamp timestamp={torrent.created_at} />
        </Text>
        <Flex gap="2">
          <Text>Tags:</Text>
          {torrent.tags
            .filter((t) => t[0] === "t")
            .map(([_, tag]) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
        </Flex>
        <ButtonGroup variant="ghost" size="sm">
          <EventZapButton event={torrent} />
          <EventQuoteButton event={torrent} />
          <Button as={Link} leftIcon={<Magnet boxSize={5} />} href={getTorrentMagnetLink(torrent)} isExternal>
            Download torrent
          </Button>
        </ButtonGroup>
      </Card>
      {torrent.content.length > 0 && (
        <>
          <Heading size="md" mt="2">
            Description
          </Heading>
          <Card p="2">
            <TextNoteContents event={torrent} />
          </Card>
        </>
      )}
      <Heading size="md" mt="2">
        Files
      </Heading>
      <Card p="2">
        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Filename</Th>
                <Th>Size</Th>
              </Tr>
            </Thead>
            <Tbody>
              {files.map((file) => (
                <Tr key={file.name}>
                  <Td>{file.name}</Td>
                  <Td>{formatBytes(file.size ?? 0)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Card>

      <Flex gap="2">
        <Heading size="md" mt="2">
          Comments
        </Heading>
        {!replyForm.isOpen && (
          <Button leftIcon={<MessageTextCircle01 />} size="sm" ml="auto" onClick={replyForm.onOpen}>
            New Comment
          </Button>
        )}
      </Flex>
      {replyForm.isOpen && (
        <ReplyForm
          item={{ event: torrent, refs: getThreadReferences(torrent), replies: new Set() }}
          onCancel={replyForm.onClose}
          onSubmitted={replyForm.onClose}
          replyKind={TORRENT_COMMENT_KIND}
        />
      )}
      <TorrentComments torrent={torrent} />
    </VerticalPageLayout>
  );
}

export default function TorrentDetailsView() {
  const pointer = useParamsEventPointer("id");
  const torrent = useSingleEvent(pointer);

  if (!torrent) return <Spinner />;

  return (
    <ErrorBoundary>
      <TorrentDetailsPage torrent={torrent} />
    </ErrorBoundary>
  );
}
