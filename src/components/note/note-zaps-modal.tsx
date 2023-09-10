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
import { DislikeIcon, LightningIcon, LikeIcon } from "../icons";
import { ParsedZap } from "../../helpers/nostr/zaps";
import { readablizeSats } from "../../helpers/bolt11";
import useEventReactions from "../../hooks/use-event-reactions";
import useEventZaps from "../../hooks/use-event-zaps";
import Timestamp from "../timestamp";

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
      <Timestamp timestamp={event.created_at} />
    </Text>
  </Flex>
));

const ZapEvent = React.memo(({ zap }: { zap: ParsedZap }) => {
  if (!zap.payment.amount) return null;

  return (
    <Box borderWidth="1px" borderRadius="lg" py="2" px={["2", "4"]}>
      <Flex gap="2" justifyContent="space-between">
        <Box>
          <UserAvatarLink pubkey={zap.request.pubkey} size="xs" mr="2" />
          <UserLink pubkey={zap.request.pubkey} />
        </Box>
        <Text fontWeight="bold">
          {readablizeSats(zap.payment.amount / 1000)} <LightningIcon color="yellow.500" />
        </Text>
      </Flex>
      <Text>{zap.request.content}</Text>
    </Box>
  );
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

  console.log(reactions);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalBody p={["2", "4"]}>
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
            {selected === "zaps" &&
              zaps
                .sort((a, b) => b.request.created_at - a.request.created_at)
                .map((zap) => <ZapEvent key={zap.request.id} zap={zap} />)}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
