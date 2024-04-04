import { FormEventHandler, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Flex, FlexProps, Input, InputGroup, InputRightElement, useDisclosure } from "@chakra-ui/react";
import { matchSorter } from "match-sorter";
import { useAsync, useKeyPressEvent, useThrottle } from "react-use";
import { nip19 } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import { useUserSearchDirectoryContext } from "../../../providers/global/user-directory-provider";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";
import KeyboardShortcut from "../../../components/keyboard-shortcut";
import { getWebOfTrust } from "../../../services/web-of-trust";

function UserOption({ pubkey }: { pubkey: string }) {
  return (
    <Flex as={RouterLink} to={`/u/${nip19.npubEncode(pubkey)}`} p="2" gap="2" alignItems="center">
      <UserAvatar pubkey={pubkey} size="sm" />
      <UserName fontWeight="bold" pubkey={pubkey} />
    </Flex>
  );
}

export default function SearchForm({ ...props }: Omit<FlexProps, "children">) {
  const getDirectory = useUserSearchDirectoryContext();
  const navigate = useNavigate();
  const autoComplete = useDisclosure();
  const ref = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");

  const queryThrottle = useThrottle(query);
  const { value: localUsers = [] } = useAsync(async () => {
    if (queryThrottle.trim().length < 2) return [];

    const webOfTrust = getWebOfTrust();
    const dir = await getDirectory();
    return matchSorter(dir, queryThrottle.trim(), {
      keys: ["names"],
      sorter: (items) =>
        webOfTrust.sortByDistanceAndConnections(
          items.sort((a, b) => b.rank - a.rank),
          (i) => i.item.pubkey,
        ),
    }).slice(0, 10);
  }, [queryThrottle]);
  useEffect(() => {
    if (localUsers.length > 0 && !autoComplete.isOpen) autoComplete.onOpen();
  }, [localUsers, autoComplete.isOpen]);

  const handleSubmit = useCallback<FormEventHandler>(
    (e) => {
      e.preventDefault();
      navigate("/search?q=" + encodeURIComponent(query));
    },
    [query],
  );

  useKeyPressEvent(
    (e) => (e.ctrlKey || e.metaKey) && e.key === "k",
    (e) => {
      e.preventDefault();
      ref.current?.focus();
    },
  );

  return (
    <Flex as="form" onSubmit={handleSubmit} position="relative" {...props}>
      <InputGroup size="lg">
        <Input
          borderRadius="lg"
          placeholder="Search users"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // onBlur={autoComplete.onClose}
          ref={ref}
        />
        <InputRightElement hideBelow="md">
          <KeyboardShortcut letter="k" requireMeta onPress={() => ref.current?.focus()} />
        </InputRightElement>
      </InputGroup>
      {autoComplete.isOpen && (
        <Card
          display="flex"
          direction="column"
          maxH="lg"
          overflowX="hidden"
          overflowY="auto"
          position="absolute"
          top="3rem"
          right="0"
          left="0"
          zIndex={10}
        >
          {localUsers.map(({ pubkey }) => (
            <UserOption key={pubkey} pubkey={pubkey} />
          ))}
        </Card>
      )}
    </Flex>
  );
}
