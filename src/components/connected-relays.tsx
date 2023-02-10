import { useState } from "react";
import {
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
} from "@chakra-ui/react";
import relayPoolService from "../services/relay-pool";
import { useInterval } from "react-use";
import { RelayStatus } from "./relay-status";
import { useIsMobile } from "../hooks/use-is-mobile";
import { RelayIcon } from "./icons";
import { Relay } from "../classes/relay";

export const ConnectedRelays = () => {
  const isMobile = useIsMobile();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [relays, setRelays] = useState<Relay[]>(relayPoolService.getRelays());

  useInterval(() => {
    setRelays(relayPoolService.getRelays());
  }, 1000);

  const connected = relays.filter((relay) => relay.okay);

  return (
    <>
      <Button variant="link" onClick={onOpen} leftIcon={<RelayIcon />}>
        {isMobile ? (
          <span>
            {connected.length}/{relays.length}
          </span>
        ) : (
          <span>
            {connected.length}/{relays.length} of relays connected
          </span>
        )}
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader pb="0">Connected Relays</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {relays.map((relay) => (
              <Text key={relay.url}>
                <RelayStatus url={relay.url} /> {relay.url}
              </Text>
            ))}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
