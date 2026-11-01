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
import type { PermissionAnswer, PermissionPrompt } from "../../services/napplet-shell/permission-controller";
import { permissionLabel } from "../../services/napplet-shell/permission-types";

export default function NappletRuntimeConsentModal({
  prompt,
  onRespond,
}: {
  prompt?: PermissionPrompt;
  onRespond(answer: PermissionAnswer): void;
}) {
  return (
    <Modal isOpen={!!prompt} onClose={() => onRespond("deny")} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{prompt?.identity.title ?? "This app"}</ModalHeader>
        <ModalBody>{prompt && permissionLabel(prompt.permission)}?</ModalBody>
        <ModalFooter>
          <ButtonGroup flexWrap="wrap">
            <Button variant="ghost" onClick={() => onRespond("deny")}>
              Deny
            </Button>
            <Button onClick={() => onRespond("session")}>Allow for this session</Button>
            <Button colorScheme="primary" onClick={() => onRespond("remember")}>
              Always allow
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
