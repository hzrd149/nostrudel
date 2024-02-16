import { Flex, Input, Modal, ModalContent, ModalOverlay, ModalProps, Text } from "@chakra-ui/react";
import { useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useAsync, useThrottle } from "react-use";
import { matchSorter } from "match-sorter";
import { nip19 } from "nostr-tools";

import { useUserSearchDirectoryContext } from "../../providers/global/user-directory-provider";
import UserAvatar from "../user/user-avatar";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { getUserDisplayName } from "../../helpers/nostr/user-metadata";

function UserOption({ pubkey }: { pubkey: string }) {
  const metadata = useUserMetadata(pubkey);

  return (
    <Flex as={RouterLink} to={`/u/${nip19.npubEncode(pubkey)}`} p="2" gap="2" alignItems="center">
      <UserAvatar pubkey={pubkey} size="sm" />
      <Text fontWeight="bold">{getUserDisplayName(metadata, pubkey)}</Text>
    </Flex>
  );
}

export default function SearchModal({ isOpen, onClose }: Omit<ModalProps, "children">) {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const getDirectory = useUserSearchDirectoryContext();

  const [inputValue, setInputValue] = useState("");
  const search = useThrottle(inputValue);

  const { value: localUsers = [] } = useAsync(async () => {
    if (search.trim().length < 2) return [];

    const dir = await getDirectory();
    return matchSorter(dir, search.trim(), { keys: ["names"] }).slice(0, 5);
  }, [search]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" initialFocusRef={searchRef}>
      <ModalOverlay />
      <ModalContent>
        <Input
          placeholder="Search"
          type="search"
          w="full"
          size="lg"
          ref={searchRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        {localUsers.map(({ pubkey }) => (
          <UserOption key={pubkey} pubkey={pubkey} />
        ))}
      </ModalContent>
    </Modal>
  );
}
