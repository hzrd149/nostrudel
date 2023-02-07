import React from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import { NostrEvent } from "../types/nostr-event";

export type PostModalProps = {
  event: NostrEvent;
  isOpen: boolean;
  onClose: () => void;
};

export const PostModal = ({ event, onClose, isOpen }: PostModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose} size="6xl">
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>{event.pubkey}</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <ReactMarkdown>
          {event.content.replace(/(?<! )\n/g, "  \n")}
        </ReactMarkdown>
      </ModalBody>
      <ModalFooter>
        <Button colorScheme="blue" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);
