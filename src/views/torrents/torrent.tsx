import { useMemo } from "react";
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

import useSingleEvent from "../../hooks/use-single-event";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { NostrEvent } from "../../types/nostr-event";
import { ErrorBoundary } from "../../components/error-boundary";
import UserAvatarLink from "../../components/user-avatar-link";
import UserLink from "../../components/user-link";
import {
  TORRENT_COMMENT_KIND,
  getTorrentFiles,
  getTorrentMagnetLink,
  getTorrentSize,
  getTorrentTitle,
} from "../../helpers/nostr/torrents";
import Magnet from "../../components/icons/magnet";
import { formatBytes } from "../../helpers/number";
import { NoteContents } from "../../components/note/text-note-contents";
import Timestamp from "../../components/timestamp";
import NoteZapButton from "../../components/note/note-zap-button";
import TorrentMenu from "./components/torrent-menu";
import QuoteRepostButton from "../../components/note/components/quote-repost-button";
import TorrentComments from "./components/torrents-comments";
import ReplyForm from "../thread/components/reply-form";
import { getThreadReferences } from "../../helpers/nostr/events";
import MessageTextCircle01 from "../../components/icons/message-text-circle-01";
import useParamsEventPointer from "../../hooks/use-params-event-pointer";

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
          <NoteZapButton event={torrent} />
          <QuoteRepostButton event={torrent} />
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
            <NoteContents event={torrent} />
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
          item={{ event: torrent, refs: getThreadReferences(torrent), replies: [] }}
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
  const torrent = useSingleEvent(pointer?.id, pointer?.relays ?? []);

  if (!torrent) return <Spinner />;

  return (
    <ErrorBoundary>
      <TorrentDetailsPage torrent={torrent} />
    </ErrorBoundary>
  );
}
