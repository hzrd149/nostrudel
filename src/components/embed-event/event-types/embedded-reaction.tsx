import { Card, CardProps, Flex, LinkBox, Spacer, Text } from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import { TrustProvider } from "../../../providers/trust";
import UserAvatarLink from "../../user-avatar-link";
import { UserLink } from "../../user-link";
import Timestamp from "../../timestamp";
import ReactionIcon from "../../event-reactions/reaction-icon";
import { NoteLink } from "../../note-link";
import { nip25 } from "nostr-tools";

export default function EmbeddedReaction({ event, ...props }: Omit<CardProps, "children"> & { event: NostrEvent }) {
  const pointer = nip25.getReactedEventPointer(event);

  return (
    <TrustProvider event={event}>
      <Card as={LinkBox} {...props}>
        <Flex p="2" gap="2" alignItems="center">
          <UserAvatarLink pubkey={event.pubkey} size="xs" />
          <UserLink pubkey={event.pubkey} fontWeight="bold" isTruncated fontSize="lg" />
          <Text as="span">Reacted with</Text>
          <ReactionIcon emoji={event.content} url={event.tags.find((t) => t[0] === "emoji")?.[1]} />
          <Text as="span">to</Text>
          {pointer && <NoteLink noteId={pointer.id} />}
          <Spacer />
          <Timestamp timestamp={event.created_at} />
        </Flex>
      </Card>
    </TrustProvider>
  );
}
