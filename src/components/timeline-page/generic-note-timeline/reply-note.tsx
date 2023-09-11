import { memo, useRef } from "react";
import { Flex, SkeletonText, Text } from "@chakra-ui/react";

import { getReferences } from "../../../helpers/nostr/events";
import useSingleEvent from "../../../hooks/use-single-event";
import { NostrEvent } from "../../../types/nostr-event";
import { EmbedEvent } from "../../embed-event";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import Note from "../../note";
import { UserAvatar } from "../../user-avatar";
import { UserLink } from "../../user-link";

function ReplyNote({ event }: { event: NostrEvent }) {
  const refs = getReferences(event);
  const parent = useSingleEvent(refs.replyId);

  // if there is a parent intersection observer, register this card
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, event.id);

  return (
    <Flex gap="2" direction="column" ref={ref}>
      <Flex gap="2">
        <UserAvatar pubkey={event.pubkey} size="xs" alignItems="center" />
        <UserLink pubkey={event.pubkey} />
        <Text>Replied to:</Text>
      </Flex>
      {parent ? <EmbedEvent event={parent} ml="4" /> : <SkeletonText />}
      <Note event={event} />
    </Flex>
  );
}
export default memo(ReplyNote);
