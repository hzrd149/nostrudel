import { FormEventHandler, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  Code,
  Flex,
  FlexProps,
  Input,
  InputGroup,
  InputRightElement,
  useDisclosure,
} from "@chakra-ui/react";
import { matchSorter } from "match-sorter";
import { useAsync, useKeyPressEvent, useThrottle } from "react-use";
import { nip19 } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import { useUserSearchDirectoryContext } from "../../../providers/global/user-directory-provider";
import UserAvatar from "../../../components/user-avatar";
import UserName from "../../../components/user-name";

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

    const dir = await getDirectory();
    return matchSorter(dir, queryThrottle.trim(), { keys: ["names"] }).slice(0, 10);
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
    (e) => e.ctrlKey && e.key === "k",
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
          <Code mx="2" fontSize="lg">
            &#8984;K
          </Code>
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
