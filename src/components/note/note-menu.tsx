import {
  Avatar,
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

import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip-19";
import { NostrEvent } from "../../types/nostr-event";
import { MenuIconButton } from "../menu-icon-button";

import { ClipboardIcon, CodeIcon, IMAGE_ICONS } from "../icons";
import { getReferences } from "../../helpers/nostr-event";

export const NoteMenu = ({ event }: { event: NostrEvent }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [_clipboardState, copyToClipboard] = useCopyToClipboard();
  const noteId = normalizeToBech32(event.id, Bech32Prefix.Note);

  return (
    <>
      <MenuIconButton>
        <MenuItem
          as="a"
          icon={<Avatar src={IMAGE_ICONS.nostrGuruIcon} size="xs" />}
          href={`https://www.nostr.guru/e/${event.id}`}
          target="_blank"
        >
          Open in Nostr.guru
        </MenuItem>
        <MenuItem
          as="a"
          icon={<Avatar src={IMAGE_ICONS.astralIcon} size="xs" />}
          href={`https://astral.ninja/${noteId}`}
          target="_blank"
        >
          Open in astral
        </MenuItem>
        <MenuItem
          as="a"
          icon={<Avatar src={IMAGE_ICONS.brbIcon} size="xs" />}
          href={`https://brb.io/n/${noteId}`}
          target="_blank"
        >
          Open in BRB
        </MenuItem>
        <MenuItem
          as="a"
          icon={<Avatar src={IMAGE_ICONS.snortSocialIcon} size="xs" />}
          href={`https://snort.social/e/${noteId}`}
          target="_blank"
        >
          Open in snort.social
        </MenuItem>
        {noteId && (
          <MenuItem onClick={() => copyToClipboard(noteId)} icon={<ClipboardIcon />}>
            Copy Note ID
          </MenuItem>
        )}
        <MenuItem onClick={onOpen} icon={<CodeIcon />}>
          View Raw
        </MenuItem>
      </MenuIconButton>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose} size="6xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Raw Event</ModalHeader>
            <ModalCloseButton />
            <ModalBody overflow="auto">
              <pre>{JSON.stringify(event, null, 2)}</pre>
              <pre>{JSON.stringify(getReferences(event), null, 2)}</pre>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};
