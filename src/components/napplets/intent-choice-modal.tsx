import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import type { IntentRequest } from "@kehto/services";
import { getNappletCatalogId } from "../../helpers/nostr/napplets";
import NappletDiscovery from "./napplet-discovery";

export default function NappletIntentChoiceModal({
  intentChoice,
  onRespond,
}: {
  intentChoice?: { request: IntentRequest };
  onRespond: (catalogId?: string) => void;
}) {
  return (
    <Modal isOpen={!!intentChoice} onClose={() => onRespond()} size="full" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Choose a napplet for {intentChoice?.request.convention}</ModalHeader>
        <ModalBody>
          {intentChoice && (
            <NappletDiscovery
              key={intentChoice.request.convention}
              request={intentChoice.request}
              onSelect={(event) => onRespond(getNappletCatalogId(event))}
            />
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => onRespond()}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
