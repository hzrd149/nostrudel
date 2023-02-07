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
import { NostrEvent } from "../types/nostr-event";
import { PostContents } from "./post/post-contents";

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
        <PostContents content={event.content} />
      </ModalBody>
      <ModalFooter>
        <Button colorScheme="blue" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);
