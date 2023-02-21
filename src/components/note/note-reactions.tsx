import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  ModalProps,
  Text,
  useDisclosure,
  Flex,
  ButtonGroup,
  IconButton,
} from "@chakra-ui/react";
import { Kind } from "nostr-tools";
import { NostrRequest } from "../../classes/nostr-request";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { DraftNostrEvent, NostrEvent } from "../../types/nostr-event";
import { UserAvatarLink } from "../user-avatar-link";
import { UserLink } from "../user-link";
import moment from "moment";
import { convertTimestampToDate } from "../../helpers/date";
import { DislikeIcon, LikeIcon } from "../icons";
import { parseZapNote } from "../../helpers/nip57";
import { readableAmountInSats } from "../../helpers/bolt11";

function useEventReactions(noteId?: string) {
  const relays = useReadRelayUrls();
  const [events, setEvents] = useState<Record<string, NostrEvent>>({});

  useEffect(() => {
    if (noteId && relays.length > 0) {
      setEvents({});
      const handler = (e: NostrEvent) => setEvents((dir) => ({ ...dir, [e.id]: e }));
      const request = new NostrRequest(relays);
      request.onEvent.subscribe(handler);
      request.start({ kinds: [Kind.Reaction, Kind.Zap], "#e": [noteId] });
      return () => {
        request.complete();
        request.onEvent.unsubscribe(handler);
      };
    }
  }, [noteId, relays.join("|"), setEvents]);

  return {
    reactions: Array.from(Object.values(events)).filter((e) => e.kind === Kind.Reaction),
    zaps: Array.from(Object.values(events)).filter((e) => e.kind === Kind.Zap),
  };
}

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
  const { payment, request } = parseZapNote(event);

  if (!payment.amount) return null;

  return (
    <Flex gap="2">
      <Text>{readableAmountInSats(payment.amount)}</Text>
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
});

function sortEvents(a: NostrEvent, b: NostrEvent) {
  return b.created_at - a.created_at;
}

export const NoteReactionsModal = ({ isOpen, onClose, noteId }: { noteId: string } & Omit<ModalProps, "children">) => {
  const { reactions, zaps } = useEventReactions(noteId);
  const [selected, setSelected] = useState("reactions");

  const [sending, setSending] = useState(false);
  const sendReaction = async (content: string) => {
    setSending(true);
    const event: DraftNostrEvent = {
      kind: Kind.Reaction,
      content,
      created_at: moment().unix(),
      tags: [["e", noteId]],
    };
    setSending(false);
  };

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

        <ModalFooter display="flex" gap="2">
          <IconButton
            icon={<LikeIcon />}
            aria-label="Like Note"
            title="Like Note"
            size="sm"
            variant="outline"
            isDisabled
          />
          <IconButton
            icon={<DislikeIcon />}
            aria-label="Dislike Note"
            title="Dislike Note"
            size="sm"
            variant="outline"
            isDisabled
          />
          <Button size="sm" variant="outline" isDisabled>
            🤙
          </Button>
          <Button size="sm" variant="outline" mr="auto" isDisabled>
            Custom
          </Button>
          <Button colorScheme="blue" onClick={onClose} size="sm">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const NoteReactions = ({ noteId }: { noteId: string }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <ButtonGroup size="xs" isAttached>
        <IconButton icon={<LikeIcon />} aria-label="Like Note" title="Like Note" />
        <Button onClick={onOpen}>Reactions</Button>
      </ButtonGroup>
      {isOpen && <NoteReactionsModal noteId={noteId} isOpen={isOpen} onClose={onClose} />}
    </>
  );
};

export default NoteReactions;
