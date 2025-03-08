import { useObservable } from "applesauce-react/hooks";

import { paywall, hidePaywall } from "../../../services/paywall";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import { unixNow } from "applesauce-core/helpers";
import RouterLink from "../../router-link";
import { useMatch } from "react-router-dom";
import { LightningIcon } from "../../icons";
import { PAYWALL_MESSAGE } from "../../../env";

export default function SupportPaywall() {
  const isSupportPage = useMatch("/support");
  const paid = useObservable(paywall);

  const dismiss = () => {
    hidePaywall.next(unixNow() + 60 * 60 * 24);
  };

  if (!paid && !isSupportPage)
    return (
      <Modal isOpen={!paid} onClose={dismiss} size="lg" closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Support the app</ModalHeader>
          <ModalBody>
            {PAYWALL_MESSAGE || "If your enjoying this app consider supporting the developer by donating some sats"}
          </ModalBody>

          <ModalFooter gap="2">
            <Button variant="link" px="4" py="2" onClick={dismiss}>
              Dismiss for a day
            </Button>
            <Button
              colorScheme="primary"
              as={RouterLink}
              to="/support"
              leftIcon={<LightningIcon color="yellow.400" boxSize={5} />}
            >
              Support
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  else return null;
}
