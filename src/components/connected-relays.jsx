import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  useDisclosure,
  Badge,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { useInterval } from "react-use";
import relayPool from "../services/relays/relay-pool";

const getRelayStatusText = (relay) => {
  if (relay.connecting) return "Connecting...";
  if (relay.connected) return "Connected";
  if (relay.closing) return "Disconnecting...";
  if (relay.closed) return "Disconnected";
};

export const ConnectedRelays = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [relays, setRelays] = useState([]);

  useInterval(() => {
    setRelays(relayPool.getRelays());
  }, 1000);

  const connected = relays.filter((relay) => relay.okay);
  const disconnected = relays.filter((relay) => !relay.okay);

  return (
    <>
      <Button variant="link" onClick={onOpen}>
        {connected.length}/{relays.length} of relays connected
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modal Title</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Url</Th>
                    <Th>status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {relays.map((relay) => (
                    <Tr keyy={relay.url}>
                      <Td>{relay.url}</Td>
                      <Td>
                        <Badge colorScheme={relay.okay ? "green" : "red"}>
                          {getRelayStatusText(relay)}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
