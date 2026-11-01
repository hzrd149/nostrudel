import {
  Button,
  ButtonGroup,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";

export default function NappletPeerConsentModal({
  isOpen,
  title,
  onRespond,
}: {
  isOpen: boolean;
  title?: string;
  onRespond: (allow: boolean) => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={() => onRespond(false)} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Allow peer connections?</ModalHeader>
        <ModalBody>
          {title ?? "This napplet"} will use your Nostr account for signaling. Direct WebRTC connections share your IP
          address with peers.
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button onClick={() => onRespond(false)}>Deny</Button>
            <Button colorScheme="primary" onClick={() => onRespond(true)}>
              Allow
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
