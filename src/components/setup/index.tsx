import { useEffect } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { useReadRelays } from "../../hooks/use-client-relays";

export default function Setup() {
  const relaysModal = useDisclosure();

  const readRelays = useReadRelays();
  useEffect(() => (readRelays.size === 0 ? relaysModal.onOpen() : relaysModal.onClose()), [readRelays]);

  return (
    <>
      <Modal isOpen={relaysModal.isOpen} onClose={relaysModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Setup Relays</ModalHeader>
          <ModalCloseButton />
          <ModalBody></ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={relaysModal.onClose}>
              Close
            </Button>
            <Button variant="ghost">Use Default</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
