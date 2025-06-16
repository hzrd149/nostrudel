import { Flex, Input, Modal, ModalContent, ModalOverlay, ModalProps, Text } from "@chakra-ui/react";
import { useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useAsync, useThrottle } from "react-use";
import { matchSorter } from "match-sorter";
import { useObservable, useObservableState } from "applesauce-react/hooks";
import { nip19 } from "nostr-tools";

import UserAvatar from "../user/user-avatar";
import useUserProfile from "../../hooks/use-user-profile";
import { getDisplayName } from "../../helpers/nostr/profile";
import { userSearchDirectory } from "../../services/username-search";

function UserOption({ pubkey }: { pubkey: string }) {
  const metadata = useUserProfile(pubkey);

  return (
    <Flex as={RouterLink} to={`/u/${nip19.npubEncode(pubkey)}`} p="2" gap="2" alignItems="center">
      <UserAvatar pubkey={pubkey} size="sm" />
      <Text fontWeight="bold">{getDisplayName(metadata, pubkey)}</Text>
    </Flex>
  );
}

export default function SearchModal({ isOpen, onClose }: Omit<ModalProps, "children">) {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const directory = useObservableState(userSearchDirectory);

  const [inputValue, setInputValue] = useState("");
  const search = useThrottle(inputValue);

  const { value: localUsers = [] } = useAsync(async () => {
    if (search.trim().length < 2) return [];

    return matchSorter(directory ?? [], search.trim(), { keys: ["names"] }).slice(0, 5);
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
