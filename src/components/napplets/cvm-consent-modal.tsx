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

export default function NappletCvmConsentModal({
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
        <ModalHeader>Allow ContextVM access?</ModalHeader>
        <ModalBody>
          {title ?? "This napplet"} can discover remote servers and send tool arguments using a local identity. Payments
          are not supported.
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
