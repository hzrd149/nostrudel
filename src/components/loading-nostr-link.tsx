import { useContext, useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { nip19 } from "nostr-tools";
import { useSet } from "react-use";
import { encodeDecodeResult } from "applesauce-core/helpers";

import { ExternalLinkIcon, SearchIcon } from "./icons";
import UserLink from "./user/user-link";

import RelayFavicon from "./relay-favicon";
import singleEventLoader from "../services/single-event-loader";
import replaceableEventLoader from "../services/replaceable-loader";
import { AppHandlerContext } from "../providers/route/app-handler-provider";
import { useObservable } from "applesauce-react/hooks";
import { connections$ } from "../services/rx-nostr";

function SearchOnRelaysModal({
  isOpen,
  onClose,
  decode,
}: Omit<ModalProps, "children"> & { decode: nip19.DecodeResult }) {
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const discoveredRelays = Object.entries(useObservable(connections$)).reduce<string[]>(
    (arr, [relay, status]) => (status !== "error" ? [...arr, relay] : arr),
    [],
  );
  const [relays, actions] = useSet<string>(new Set(discoveredRelays.slice(0, 4)));

  const searchForEvent = async () => {
    if (relays.size === 0) return;
    setLoading(true);
    switch (decode.type) {
      case "naddr":
        replaceableEventLoader.next({
          ...decode.data,
          relays: [...relays, ...(decode.data.relays ?? [])],
          force: true,
        });
        break;
      case "note":
        singleEventLoader.next({ id: decode.data, relays: Array.from(relays) });
        break;
      case "nevent":
        singleEventLoader.next({ id: decode.data.id, relays: Array.from(relays) });
        break;
    }
  };

  const filtered = filter ? discoveredRelays.filter((r) => r.includes(filter)) : discoveredRelays;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4">Search for event</ModalHeader>
        <ModalCloseButton />
        <ModalBody px="2" pb="2" pt="0" gap="2" display="flex" flexDirection="column">
          {loading ? (
            <Heading size="md" mx="auto">
              Searching {relays.size} relays...
            </Heading>
          ) : (
            <>
              <Input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                autoFocus
                placeholder="Filter relays"
              />
              {filtered.map((relay) => (
                <Button
                  key={relay}
                  variant="outline"
                  w="full"
                  p="2"
                  leftIcon={<RelayFavicon relay={relay} size="xs" />}
                  justifyContent="flex-start"
                  colorScheme={relays.has(relay) ? "primary" : undefined}
                  onClick={() => (relays.has(relay) ? actions.remove(relay) : actions.add(relay))}
                >
                  {relay}
                </Button>
              ))}
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <ButtonGroup>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="primary" onClick={searchForEvent} isLoading={loading}>
              Search
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function LoadingNostrLink({ link }: { link: nip19.DecodeResult }) {
  const { openAddress } = useContext(AppHandlerContext);
  const address = encodeDecodeResult(link);
  const details = useDisclosure();
  const search = useDisclosure();

  const renderDetails = () => {
    switch (link.type) {
      case "note":
        return <Text>ID: {link.data}</Text>;
      case "nevent":
        return (
          <>
            <Text>ID: {link.data.id}</Text>
            {link.data.kind && <Text>Kind: {link.data.kind}</Text>}
            {link.data.author && (
              <Text>
                Pubkey: <UserLink pubkey={link.data.author} />
              </Text>
            )}
            {link.data.relays && link.data.relays.length > 0 && <Text>Relays: {link.data.relays.join(", ")}</Text>}
          </>
        );
      case "npub":
        return <Text>Pubkey: {link.data}</Text>;
      case "nprofile":
        return (
          <>
            <Text>Pubkey: {link.data.pubkey}</Text>
            {link.data.relays && link.data.relays.length > 0 && <Text>Relays: {link.data.relays.join(", ")}</Text>}
          </>
        );
      case "naddr":
        return (
          <>
            <Text>Kind: {link.data.kind}</Text>
            <Text>
              Pubkey: <UserLink pubkey={link.data.pubkey} />
            </Text>
            <Text>Identifier: {link.data.identifier}</Text>
            {link.data.relays && link.data.relays.length > 0 && <Text>Relays: {link.data.relays.join(", ")}</Text>}
          </>
        );
    }
    return null;
  };

  return (
    <>
      <Button
        variant="link"
        color="GrayText"
        maxW="lg"
        textAlign="left"
        fontFamily="monospace"
        whiteSpace="pre"
        onClick={details.onToggle}
      >
        [{details.isOpen ? "-" : "+"}]
        <Text as="span" isTruncated>
          {address}
        </Text>
      </Button>
      {details.isOpen && (
        <Box px="2" fontFamily="monospace" color="GrayText" fontWeight="bold" fontSize="sm">
          <Text>Type: {link.type}</Text>
          {renderDetails()}
          <ButtonGroup variant="link" size="sm" my="1">
            <Button leftIcon={<SearchIcon />} colorScheme="primary" onClick={search.onOpen}>
              Find
            </Button>
            <Button leftIcon={<ExternalLinkIcon />} onClick={() => openAddress(address)}>
              Open
            </Button>
          </ButtonGroup>
        </Box>
      )}
      {search.isOpen && <SearchOnRelaysModal isOpen onClose={search.onClose} decode={link} />}
    </>
  );
}
