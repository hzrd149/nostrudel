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

import { getNappletIdentity, getNappletTitle } from "../../helpers/nostr/napplets";
import { getPermissionDecision } from "../../services/napplet-shell/permissions";

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
      consent?.capabilities.filter(
        (permission) => getPermissionDecision(getNappletIdentity(consent.event), permission) !== "block",
      ) ?? [],
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
                <Code>{getNappletTitle(consent.event)}</Code>
              </Text>
              <Flex direction="column" gap="3">
                {consent.capabilities.map((permission) => (
                  <Checkbox
                    key={permission}
                    colorScheme="primary"
                    isDisabled={getPermissionDecision(getNappletIdentity(consent.event), permission) === "block"}
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
                    {getPermissionDecision(getNappletIdentity(consent.event), permission) === "block" && " (Rejected)"}
                  </Checkbox>
                ))}
              </Flex>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button variant="ghost" onClick={() => onRespond(false)}>
              Cancel
            </Button>
            <Button onClick={() => onRespond(true, false, selected)}>Allow</Button>
            <Button colorScheme="primary" onClick={() => onRespond(true, true, selected)}>
              Always
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
