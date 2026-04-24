import { Card, CardProps, Divider, Flex, Link } from "@chakra-ui/react";
import { Stream } from "applesauce-common/casts";
import { isATag } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import useCastEvent from "../../../hooks/use-cast-event";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import { getSharableEventAddress } from "../../../services/relay-hints";
import StreamStatusBadge from "../../../views/streams/components/status-badge";
import ChatMessageContent from "../../../views/streams/stream/stream-chat/chat-message-content";
import UserAvatar from "../../user/user-avatar";
import UserLink from "../../user/user-link";

export default function EmbeddedStreamMessage({
  message,
  ...props
}: Omit<CardProps, "children"> & { message: NostrEvent }) {
  const streamCoordinate = message.tags.find(isATag)?.[1];
  const stream = useReplaceableEvent(streamCoordinate);
  const cast = useCastEvent(stream, Stream);

  return (
    <Card overflow="hidden" maxH="lg" display="block" p="2" {...props}>
      {cast && stream && (
        <>
          <Flex gap="2" alignItems="center">
            <Link
              as={RouterLink}
              to={`/streams/${getSharableEventAddress(stream) ?? ""}`}
              fontWeight="bold"
              fontSize="lg"
            >
              {cast.title || "Untitled stream"}
            </Link>
            <StreamStatusBadge stream={cast} />
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
