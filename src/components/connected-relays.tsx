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
import { Relay } from "../services/relays";
import relayPool from "../services/relays/relay-pool";
import { useInterval } from "react-use";
import { RelayStatus } from "./relay-status";
import { useIsMobile } from "../hooks/use-is-mobile";
import { RelayIcon } from "./icons";

export const ConnectedRelays = () => {
  const isMobile = useIsMobile();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [relays, setRelays] = useState<Relay[]>(relayPool.getRelays());

  useInterval(() => {
    setRelays(relayPool.getRelays());
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
