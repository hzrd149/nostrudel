import {
  Button,
  ButtonGroup,
  Checkbox,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useEffect, useState } from "react";

import { getNappletIdentity, getNappletTitle } from "../../helpers/nostr/napplets";
import { installNapplet } from "../../services/installed-napplets";
import {
  getNappletPermissions,
  permissionLabel,
  type NappletPermission,
} from "../../services/napplet-shell/permission-types";
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
  const capabilities = getNappletPermissions(event);
  const [selected, setSelected] = useState<NappletPermission[]>([]);
  useEffect(() => {
    setSelected(
      getNappletPermissions(event).filter((permission) => !["cvm:call", "webrtc:connect"].includes(permission)),
    );
    setAllow(false);
  }, [event, isOpen]);

  const install = () => {
    installNapplet(event);
    if (allow) addAlwaysAllowed(getNappletIdentity(event), selected);
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
              <Flex direction="column" gap="3" mb="4">
                {capabilities.map((permission) => (
                  <Checkbox
                    key={permission}
                    colorScheme="primary"
                    isChecked={selected.includes(permission)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, permission]
                          : current.filter((value) => value !== permission),
                      )
                    }
                  >
                    {permissionLabel(permission)}
                  </Checkbox>
                ))}
              </Flex>
              <Checkbox colorScheme="primary" isChecked={allow} onChange={(e) => setAllow(e.target.checked)}>
                Allow these now instead of asking when it opens
              </Checkbox>
              <Text color="GrayText" mt="1">
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
