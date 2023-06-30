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
  Box,
} from "@chakra-ui/react";
import { NostrEvent } from "../../types/nostr-event";
import { UserAvatarLink } from "../user-avatar-link";
import { UserLink } from "../user-link";
import dayjs from "dayjs";
import { DislikeIcon, LightningIcon, LikeIcon } from "../icons";
import { parseZapEvent } from "../../helpers/zaps";
import { readablizeSats } from "../../helpers/bolt11";
import useEventReactions from "../../hooks/use-event-reactions";
import useEventZaps from "../../hooks/use-event-zaps";
import { useIsMobile } from "../../hooks/use-is-mobile";

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
      {dayjs.unix(event.created_at).fromNow()}
    </Text>
  </Flex>
));

const ZapEvent = React.memo(({ event }: { event: NostrEvent }) => {
  const isMobile = useIsMobile();
  try {
    const { payment, request } = parseZapEvent(event);

    if (!payment.amount) return null;

    return (
      <Box borderWidth="1px" borderRadius="lg" py="2" px={isMobile ? "2" : "4"}>
        <Flex gap="2" justifyContent="space-between">
          <Box>
            <UserAvatarLink pubkey={request.pubkey} size="xs" mr="2" />
            <UserLink pubkey={request.pubkey} />
          </Box>
          <Text fontWeight="bold">
            {readablizeSats(payment.amount / 1000)} <LightningIcon color="yellow.500" />
          </Text>
          {/* <Text width="35%" textAlign="right">
            {dayjs.unix(event.created_at).fromNow()}
          </Text> */}
        </Flex>
        <Text>{request.content}</Text>
      </Box>
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
  const [selected, setSelected] = useState("zaps");
  const isMobile = useIsMobile();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalBody p={isMobile ? "2" : "4"}>
          <Flex direction="column" gap="2">
            <ButtonGroup>
              <Button size="sm" variant={selected === "zaps" ? "solid" : "outline"} onClick={() => setSelected("zaps")}>
                Zaps ({zaps.length})
              </Button>
              <Button
                size="sm"
                variant={selected === "reactions" ? "solid" : "outline"}
                onClick={() => setSelected("reactions")}
              >
                Reactions ({reactions.length})
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
