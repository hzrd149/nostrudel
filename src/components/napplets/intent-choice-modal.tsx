import { Button, Flex, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import type { IntentCandidate } from "@kehto/services";

import useInstalledNapplets from "../../hooks/use-installed-napplets";
import { getInstalledNappletByCatalogId } from "../../services/installed-napplets";
import InstalledNappletIcon from "./installed-napplet-icon";

export type NappletIntentChoiceRequest = {
  archetype: string;
  candidates: readonly IntentCandidate[];
};

export type NappletIntentChoiceModalProps = {
  intentChoice: NappletIntentChoiceRequest | undefined;
  onRespond: (catalogId?: string) => void;
};

export default function NappletIntentChoiceModal({ intentChoice, onRespond }: NappletIntentChoiceModalProps) {
  const installed = useInstalledNapplets();

  return (
    <Modal isOpen={!!intentChoice} onClose={() => onRespond()} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Open {intentChoice?.archetype} with</ModalHeader>
        <ModalBody>
          <Flex direction="column" gap="2">
            {intentChoice?.candidates.map((candidate) => {
              const napplet = getInstalledNappletByCatalogId(candidate.id, installed);

              return (
                <Button
                  key={candidate.id}
                  variant="outline"
                  justifyContent="flex-start"
                  whiteSpace="normal"
                  h="auto"
                  py="3"
                  gap="3"
                  leftIcon={napplet && <InstalledNappletIcon napplet={napplet} boxSize="8" />}
                  onClick={() => onRespond(candidate.id)}
                >
                  {candidate.title ?? napplet?.title ?? candidate.id}
                </Button>
              );
            })}
          </Flex>
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
