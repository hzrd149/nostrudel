import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Button,
  ModalProps,
  Text,
  Flex,
  ButtonGroup,
} from "@chakra-ui/react";
import { NostrEvent } from "../../types/nostr-event";
import { UserAvatarLink } from "../user-avatar-link";
import { UserLink } from "../user-link";
import moment from "moment";
import { convertTimestampToDate } from "../../helpers/date";
import { DislikeIcon, LikeIcon } from "../icons";
import { parseZapNote } from "../../helpers/zaps";
import { readablizeSats } from "../../helpers/bolt11";
import useEventReactions from "../../hooks/use-event-reactions";
import useEventZaps from "../../hooks/use-event-zaps";

function getReactionIcon(content: string) {
  switch (content) {
    case "+":
      return <LikeIcon />;
    case "-":
      return <DislikeIcon />;
    default:
      return content;
  }
}

const ReactionEvent = React.memo(({ event }: { event: NostrEvent }) => (
  <Flex gap="2">
    <Text>{getReactionIcon(event.content)}</Text>
    <Flex overflow="hidden" gap="2">
      <UserAvatarLink pubkey={event.pubkey} size="xs" />
      <UserLink pubkey={event.pubkey} />
    </Flex>
    <Text ml="auto" flexShrink={0}>
      {moment(convertTimestampToDate(event.created_at)).fromNow()}
    </Text>
  </Flex>
));

const ZapEvent = React.memo(({ event }: { event: NostrEvent }) => {
  try {
    const { payment, request } = parseZapNote(event);

    if (!payment.amount) return null;

    return (
      <Flex gap="2">
        <Text>{readablizeSats(payment.amount / 1000)}</Text>
        <Flex overflow="hidden" gap="2">
          <UserAvatarLink pubkey={request.pubkey} size="xs" />
          <UserLink pubkey={request.pubkey} />
        </Flex>
        <Text>{request.content}</Text>
        <Text ml="auto" flexShrink={0}>
          {moment(convertTimestampToDate(event.created_at)).fromNow()}
        </Text>
      </Flex>
    );
  } catch (e) {
    return <Text>Invalid Zap</Text>;
  }
});

function sortEvents(a: NostrEvent, b: NostrEvent) {
  return b.created_at - a.created_at;
}

export default function NoteReactionsModal({
  isOpen,
  onClose,
  noteId,
}: { noteId: string } & Omit<ModalProps, "children">) {
  const zaps = useEventZaps(noteId, [], true) ?? [];
  const reactions = useEventReactions(noteId, [], true) ?? [];
  const [selected, setSelected] = useState("reactions");

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalBody>
          <Flex direction="column" gap="2">
            <ButtonGroup>
              <Button size="sm" variant="outline" onClick={() => setSelected("reactions")}>
                Reactions ({reactions.length})
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelected("zaps")}>
                Zaps ({zaps.length})
              </Button>
            </ButtonGroup>
            {selected === "reactions" &&
              reactions.sort(sortEvents).map((event) => <ReactionEvent key={event.id} event={event} />)}
            {selected === "zaps" && zaps.sort(sortEvents).map((event) => <ZapEvent key={event.id} event={event} />)}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
