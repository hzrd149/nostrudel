import {
  Flex,
  FlexProps,
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

import relayScoreboardService from "../services/relay-scoreboard";
import RelayFavicon from "./relay/relay-favicon";

export type RelayIconStackProps = { relays: string[]; maxRelays?: number } & Omit<FlexProps, "children">;

export function RelayIconStack({ relays, maxRelays, ...props }: RelayIconStackProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const topRelays = relayScoreboardService.getRankedRelays(relays);
  const clamped = maxRelays ? topRelays.slice(0, maxRelays) : topRelays;

  return (
    <>
      <Flex
        alignItems="center"
        gap="-4"
        overflow="hidden"
        cursor="pointer"
        onClick={onOpen}
        role="button"
        tabIndex={0}
        aria-label="View relay information"
        {...props}
      >
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
            <Flex gap="2" wrap="wrap" role="list">
              {topRelays.map((url) => (
                <Tag
                  key={url}
                  as={RouterLink}
                  p="2"
                  fontWeight="bold"
                  fontSize="md"
                  to={`/relays/${encodeURIComponent(url)}`}
                  role="listitem"
                  tabIndex={0}
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
