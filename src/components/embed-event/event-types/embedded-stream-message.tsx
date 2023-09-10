import { Box, Card, CardProps, Divider, Flex, Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { NostrEvent, isATag } from "../../../types/nostr-event";
import { UserLink } from "../../user-link";
import { UserAvatar } from "../../user-avatar";
import ChatMessageContent from "../../../views/streams/stream/stream-chat/chat-message-content";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import { parseStreamEvent } from "../../../helpers/nostr/stream";
import StreamStatusBadge from "../../../views/streams/components/status-badge";
import { getSharableEventAddress } from "../../../helpers/nip19";

export default function EmbeddedStreamMessage({
  message,
  ...props
}: Omit<CardProps, "children"> & { message: NostrEvent }) {
  const streamCoordinate = message.tags.find(isATag)?.[1];
  const streamEvent = useReplaceableEvent(streamCoordinate);
  const stream = streamEvent && parseStreamEvent(streamEvent);

  return (
    <Card overflow="hidden" maxH="lg" display="block" p="2" {...props}>
      {stream && (
        <>
          <Flex gap="2" alignItems="center">
            <Link
              as={RouterLink}
              to={`/streams/${getSharableEventAddress(streamEvent) ?? ""}`}
              fontWeight="bold"
              fontSize="lg"
            >
              {stream.title}
            </Link>
            <StreamStatusBadge stream={stream} />
          </Flex>
          <Divider mb="2" />
        </>
      )}
      <UserAvatar pubkey={message.pubkey} size="xs" display="inline-block" mr="2" />
      <UserLink pubkey={message.pubkey} fontWeight="bold" />
      <span>: </span>
      <ChatMessageContent event={message} />
    </Card>
  );
}
