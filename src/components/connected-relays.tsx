import { useMemo, useState } from "react";
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
  TableContainer,
  Table,
  Thead,
  Tbody,
  Td,
  Tr,
  Th,
  Flex,
  ButtonProps,
} from "@chakra-ui/react";

import relayPoolService from "../services/relay-pool";
import { useInterval } from "react-use";
import { RelayStatus } from "./relay-status";
import { RelayIcon } from "./icons";
import Relay from "../classes/relay";
import { RelayFavicon } from "./relay-favicon";
import relayScoreboardService from "../services/relay-scoreboard";
import { RelayScoreBreakdown } from "./relay-score-breakdown";

export const ConnectedRelays = ({ ...props }: Omit<ButtonProps, "children">) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [relays, setRelays] = useState<Relay[]>(relayPoolService.getRelays());
  const sortedRelays = useMemo(() => relayScoreboardService.getRankedRelays(relays.map((r) => r.url)), [relays]);

  useInterval(() => {
    setRelays(relayPoolService.getRelays());
  }, 1000);

  const connected = relays.filter((relay) => relay.okay);

  return (
    <>
      <Button onClick={onOpen} leftIcon={<RelayIcon />} {...props}>
        connected to {connected.length} relays
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} size="5xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader pb="0">Connected Relays</ModalHeader>
          <ModalCloseButton />
          <ModalBody p="2">
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Relay</Th>
                    <Th>Claims</Th>
                    <Th>Score</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {sortedRelays.map((url) => (
                    <Tr key={url}>
                      <Td>
                        <Flex alignItems="center" maxW="sm" overflow="hidden">
                          <RelayFavicon size="xs" relay={url} mr="2" />
                          <Text>{url}</Text>
                        </Flex>
                      </Td>
                      <Td>{relayPoolService.getRelayClaims(url).size}</Td>
                      <Td>
                        <RelayScoreBreakdown relay={url} />
                      </Td>
                      <Td>
                        <RelayStatus url={url} />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
