import {
  Flex,
  FlexProps,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Tag,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

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
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader px="4" pt="4" pb="2">
            Seen on relays:
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody px="4" pb="4" pt="0">
            <Flex gap="2" wrap="wrap">
              {topRelays.map((url) => (
                <Tag
                  key={url}
                  as={RouterLink}
                  p="2"
                  fontWeight="bold"
                  fontSize="md"
                  to={`/r/${encodeURIComponent(url)}`}
                >
                  <RelayFavicon relay={url} size="xs" mr="2" />
                  {url}
                </Tag>
              ))}
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
