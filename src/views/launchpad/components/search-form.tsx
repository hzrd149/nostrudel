import { Card, Flex, FlexProps, Input, InputGroup, InputRightElement, useDisclosure } from "@chakra-ui/react";
import { nip19 } from "nostr-tools";
import { FormEventHandler, useCallback, useEffect, useRef, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAsync, useKeyPressEvent } from "react-use";
import { useDebounce } from "react-use";

import KeyboardShortcut from "../../../components/keyboard-shortcut";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";
import { lookupUsers } from "../../../services/username-search";
import { sortByDistanceAndConnections } from "../../../services/social-graph";

function UserOption({ pubkey }: { pubkey: string }) {
  return (
    <Flex as={RouterLink} to={`/u/${nip19.npubEncode(pubkey)}`} p="2" gap="2" alignItems="center">
      <UserAvatar pubkey={pubkey} size="sm" />
      <UserName fontWeight="bold" pubkey={pubkey} />
    </Flex>
  );
}

export default function SearchForm({ ...props }: Omit<FlexProps, "children">) {
  const navigate = useNavigate();
  const autoComplete = useDisclosure();
  const ref = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useDebounce(
    () => {
      setDebouncedQuery(query);
    },
    300,
    [query],
  );

  const { value: localUsers = [] } = useAsync(async () => {
    if (debouncedQuery.trim().length < 2) return [];

    const results = await lookupUsers(debouncedQuery.trim(), 10);
    return sortByDistanceAndConnections(results, (r) => r.pubkey);
  }, [debouncedQuery]);
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
