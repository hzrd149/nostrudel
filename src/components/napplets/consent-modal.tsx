import {
  Button,
  ButtonGroup,
  Code,
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
import { useEffect, useState } from "react";
import { permissionLabel, type NappletPermission } from "../../services/napplet-shell/permission-types";
import { NostrEvent } from "nostr-tools";

import { getNappletTitle } from "../../helpers/nostr/napplets";

export type NappletConsentRequest = {
  event: NostrEvent;
  capabilities: NappletPermission[];
};

export type NappletConsentModalProps = {
  consent: NappletConsentRequest | undefined;
  onRespond: (allow: boolean, always?: boolean, selected?: NappletPermission[]) => void;
};

export default function NappletConsentModal({ consent, onRespond }: NappletConsentModalProps) {
  const [selected, setSelected] = useState<NappletPermission[]>([]);
  useEffect(() => {
    setSelected(
      consent?.capabilities.filter((permission) => !["cvm:call", "webrtc:connect"].includes(permission)) ?? [],
    );
  }, [consent]);
  return (
    <Modal isOpen={!!consent} onClose={() => onRespond(false)} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Open app?</ModalHeader>
        <ModalBody>
          {consent && (
            <>
              <Text mb="2">
                <Code>{getNappletTitle(consent.event)}</Code> will ask at runtime for permissions you leave unchecked.
              </Text>
              <Flex direction="column" gap="3">
                {consent.capabilities.map((permission) => (
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
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button variant="ghost" onClick={() => onRespond(false)}>
              Deny
            </Button>
            <Button onClick={() => onRespond(true, false, selected)}>Open</Button>
            <Button colorScheme="primary" onClick={() => onRespond(true, true, selected)}>
              Remember and open
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
