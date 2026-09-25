import {
  Button,
  ButtonGroup,
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
import { type Capability } from "@kehto/shell";
import { NostrEvent } from "nostr-tools";

import { getNappletTitle } from "../../helpers/nostr/napplets";

export type NappletConsentRequest = {
  event: NostrEvent;
  capabilities: Capability[];
};

export type NappletConsentModalProps = {
  consent: NappletConsentRequest | undefined;
  onRespond: (allow: boolean, always?: boolean) => void;
};

export default function NappletConsentModal({ consent, onRespond }: NappletConsentModalProps) {
  return (
    <Modal isOpen={!!consent} onClose={() => onRespond(false)} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Grant napplet access?</ModalHeader>
        <ModalBody>
          {consent && (
            <>
              <Text mb="2">
                <Code>{getNappletTitle(consent.event)}</Code> is requesting access until this frame is closed.
              </Text>
              <UnorderedList spacing="1">
                {consent.capabilities.map((capability) => (
                  <ListItem key={capability}>
                    <Code>{capability}</Code>
                  </ListItem>
                ))}
              </UnorderedList>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button variant="ghost" onClick={() => onRespond(false)}>
              Deny
            </Button>
            <Button onClick={() => onRespond(true)}>Allow once</Button>
            <Button colorScheme="primary" onClick={() => onRespond(true, true)}>
              Always allow
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
