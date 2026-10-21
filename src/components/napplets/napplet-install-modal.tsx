import {
  Button,
  ButtonGroup,
  Checkbox,
  Code,
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useState } from "react";

import { getNappletIdentity, getNappletRequiredCapabilities, getNappletTitle } from "../../helpers/nostr/napplets";
import { installNapplet } from "../../services/installed-napplets";
import { addAlwaysAllowed } from "../../services/napplet-shell/permissions";

/** Shows what a napplet will ask for before installing it, with the option to allow it up front */
export default function NappletInstallModal({
  event,
  isOpen,
  onClose,
}: {
  event: NostrEvent;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [allow, setAllow] = useState(false);
  const capabilities = getNappletRequiredCapabilities(event);

  const install = () => {
    installNapplet(event);
    if (allow) addAlwaysAllowed(getNappletIdentity(event), capabilities);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Install {getNappletTitle(event)}?</ModalHeader>
        <ModalBody>
          {capabilities.length === 0 ? (
            <Text>This app does not ask for any permissions.</Text>
          ) : (
            <>
              <Text mb="2">This app will ask for:</Text>
              <UnorderedList spacing="1" mb="4">
                {capabilities.map((capability) => (
                  <ListItem key={capability}>
                    <Code>{capability}</Code>
                  </ListItem>
                ))}
              </UnorderedList>
              <Checkbox isChecked={allow} onChange={(e) => setAllow(e.target.checked)}>
                Allow these now instead of asking when it opens
              </Checkbox>
              <Text color="GrayText" fontSize="sm" mt="1">
                Applies to this version only. Updates ask again.
              </Text>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="primary" onClick={install}>
              Install
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
