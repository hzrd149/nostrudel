import {
  Button,
  Code,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from "@chakra-ui/react";

import { type InstalledNapplet } from "../../services/installed-napplets";

export type NappletIntentChoiceRequest = {
  archetype: string;
  action: string;
};

export type NappletIntentChoiceModalProps = {
  intentChoice: NappletIntentChoiceRequest | undefined;
  installedNapplets: InstalledNapplet[];
  onRespond: (handler?: InstalledNapplet) => void;
};

export default function NappletIntentChoiceModal({
  intentChoice,
  installedNapplets,
  onRespond,
}: NappletIntentChoiceModalProps) {
  return (
    <Modal isOpen={!!intentChoice} onClose={() => onRespond()} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Choose a napplet</ModalHeader>
        <ModalBody>
          {intentChoice && (
            <Stack spacing="3">
              <Text>
                No installed napplet declares support for <Code>{intentChoice.archetype}</Code>/
                <Code>{intentChoice.action}</Code>. Choose a napplet to handle this intent.
              </Text>
              <Stack spacing="2">
                {installedNapplets.map((napplet) => (
                  <Button
                    key={napplet.address}
                    variant="outline"
                    justifyContent="flex-start"
                    whiteSpace="normal"
                    h="auto"
                    py="3"
                    onClick={() => onRespond(napplet)}
                  >
                    {napplet.title}
                  </Button>
                ))}
              </Stack>
            </Stack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => onRespond()}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
