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

export const PostModal = ({ event, onClose, isOpen }) => (
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
