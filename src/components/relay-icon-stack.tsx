import {
  Avatar,
  Box,
  Flex,
  FlexProps,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { RelayFavicon } from "./relay-favicon";
import relayScoreboardService from "../services/relay-scoreboard";

export function RelayIconStack({ relays, maxRelays, ...props }: { relays: string[]; maxRelays?: number } & FlexProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const topRelays = relayScoreboardService.getRankedRelays(relays);
  const clamped = maxRelays ? topRelays.slice(0, maxRelays) : topRelays;

  return (
    <>
      <Flex alignItems="center" gap="-4" overflow="hidden" cursor="pointer" onClick={onOpen} {...props}>
        {clamped.map((url) => (
          <RelayFavicon key={url} relay={url} size="2xs" title={url} />
        ))}
        {clamped.length !== topRelays.length && (
          <Text mx="1" fontSize="sm" lineHeight={0}>
            +{topRelays.length - clamped.length}
          </Text>
        )}
      </Flex>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Relays</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction="column" gap="1">
              {topRelays.map((url) => (
                <Flex key={url}>
                  <RelayFavicon relay={url} size="2xs" mr="2" />
                  <Text>{url}</Text>
                </Flex>
              ))}
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
