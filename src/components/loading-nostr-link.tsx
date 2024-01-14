import { Box, Button, ButtonGroup, Link, Text, useDisclosure } from "@chakra-ui/react";
import { nip19 } from "nostr-tools";

import { ExternalLinkIcon, SearchIcon } from "./icons";
import { buildAppSelectUrl } from "../helpers/nostr/apps";
import UserLink from "./user-link";
import { encodeDecodeResult } from "../helpers/nip19";

export default function LoadingNostrLink({ link }: { link: nip19.DecodeResult }) {
  const encoded = encodeDecodeResult(link);
  const details = useDisclosure();

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
            {link.data.relays && <Text>Relays: {link.data.relays.join(", ")}</Text>}
          </>
        );
      case "npub":
        return <Text>Pubkey: {link.data}</Text>;
      case "nprofile":
        return (
          <>
            <Text>Pubkey: {link.data.pubkey}</Text>
            {link.data.relays && <Text>Relays: {link.data.relays.join(", ")}</Text>}
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
          {encoded}
        </Text>
      </Button>
      {details.isOpen && (
        <Box px="2" fontFamily="monospace" color="GrayText" fontWeight="bold" fontSize="sm">
          <Text>Type: {link.type}</Text>
          {renderDetails()}
          <ButtonGroup variant="link" size="sm" my="1">
            <Button leftIcon={<SearchIcon />} colorScheme="primary" isDisabled>
              Find
            </Button>
            <Button as={Link} leftIcon={<ExternalLinkIcon />} href={buildAppSelectUrl(encoded)} isExternal>
              Open
            </Button>
          </ButtonGroup>
        </Box>
      )}
    </>
  );
}
