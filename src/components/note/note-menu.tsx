import {
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { useCopyToClipboard } from "react-use";
import { nip19 } from "nostr-tools";

import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip19";
import { NostrEvent } from "../../types/nostr-event";
import { MenuIconButton, MenuIconButtonProps } from "../menu-icon-button";

import { ClipboardIcon, CodeIcon, LikeIcon, ShareIcon } from "../icons";
import { getReferences } from "../../helpers/nostr-event";
import NoteReactionsModal from "./note-zaps-modal";
import { getEventRelays } from "../../services/event-relays";
import relayScoreboardService from "../../services/relay-scoreboard";

function getShareLink(eventId: string) {
  const relays = getEventRelays(eventId).value;
  const ranked = relayScoreboardService.getRankedRelays(relays);
  const onlyTwo = ranked.slice(0, 2);

  if (onlyTwo.length > 0) {
    return nip19.neventEncode({ id: eventId, relays: onlyTwo });
  } else return nip19.noteEncode(eventId);
}

export const NoteMenu = ({ event, ...props }: { event: NostrEvent } & Omit<MenuIconButtonProps, "children">) => {
  const infoModal = useDisclosure();
  const reactionsModal = useDisclosure();
  const [_clipboardState, copyToClipboard] = useCopyToClipboard();
  const noteId = normalizeToBech32(event.id, Bech32Prefix.Note);

  return (
    <>
      <MenuIconButton {...props}>
        <MenuItem onClick={reactionsModal.onOpen} icon={<LikeIcon />}>
          Zaps/Reactions
        </MenuItem>
        <MenuItem onClick={() => copyToClipboard("nostr:" + getShareLink(event.id))} icon={<ShareIcon />}>
          Copy Share Link
        </MenuItem>
        {noteId && (
          <MenuItem onClick={() => copyToClipboard(noteId)} icon={<ClipboardIcon />}>
            Copy Note ID
          </MenuItem>
        )}
        <MenuItem onClick={infoModal.onOpen} icon={<CodeIcon />}>
          View Raw
        </MenuItem>
      </MenuIconButton>
      {infoModal.isOpen && (
        <Modal isOpen={infoModal.isOpen} onClose={infoModal.onClose} size="6xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Raw Event</ModalHeader>
            <ModalCloseButton />
            <ModalBody overflow="auto" fontSize="sm" padding="2">
              Raw JSON:
              <pre>{JSON.stringify(event, null, 2)}</pre>
              Parsed Refs:
              <pre>{JSON.stringify(getReferences(event), null, 2)}</pre>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
      {reactionsModal.isOpen && (
        <NoteReactionsModal noteId={event.id} isOpen={reactionsModal.isOpen} onClose={reactionsModal.onClose} />
      )}
    </>
  );
};
