import { Card, Flex, Input, InputProps, useDisclosure } from "@chakra-ui/react";
import { nip19 } from "nostr-tools";
import { forwardRef, useEffect, useState } from "react";
import { useDebounce } from "react-use";

import { sortByDistanceAndConnections } from "../services/social-graph";
import { lookupUsers, SearchResult } from "../services/username-search";
import UserAvatar from "./user/user-avatar";
import UserName from "./user/user-name";

type UserAutocompleteProps = Omit<InputProps, "value"> & {
  value?: string;
  hex?: boolean;
  onSelectUser?: (pubkey: string) => void;
};

function UserOption({ pubkey, onClick }: { pubkey: string; onClick: () => void }) {
  return (
    <Flex
      p="2"
      gap="2"
      alignItems="center"
      cursor="pointer"
      _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
      onClick={onClick}
    >
      <UserAvatar pubkey={pubkey} size="sm" />
      <UserName fontWeight="bold" pubkey={pubkey} />
    </Flex>
  );
}

const UserAutocomplete = forwardRef<HTMLInputElement, UserAutocompleteProps>(
  ({ value, hex, onSelectUser, onChange, ...props }, ref) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const autoComplete = useDisclosure();

    // Use the display value for the input - either the controlled value or internal query
    const displayValue = value !== undefined ? value : query;

    useDebounce(
      () => {
        const searchQuery = value !== undefined ? value : query;
        if (searchQuery && searchQuery.length >= 2) {
          lookupUsers(searchQuery, 20).then((users) => {
            const sorted = sortByDistanceAndConnections(users, (r) => r.pubkey);
            setResults(sorted);
          });
        } else {
          setResults([]);
        }
      },
      300,
      [value, query],
    );

    useEffect(() => {
      if (results.length > 0 && !autoComplete.isOpen) autoComplete.onOpen();
      if (results.length === 0 && autoComplete.isOpen) autoComplete.onClose();
    }, [results, autoComplete.isOpen]);

    const handleSelectUser = (pubkey: string) => {
      const userValue = hex ? pubkey : nip19.npubEncode(pubkey);
      onSelectUser?.(userValue);
      // Create a synthetic event to call onChange
      if (onChange) {
        const syntheticEvent = {
          target: { value: pubkey },
          currentTarget: { value: pubkey },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
      autoComplete.onClose();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // If value is controlled (provided from parent), call onChange with the new value
      if (value !== undefined) {
        onChange?.(e);
      } else {
        // Otherwise, update internal state
        setQuery(e.target.value);
        onChange?.(e);
      }
    };

    return (
      <Flex position="relative" w="full">
        <Input placeholder="Users" value={displayValue} onChange={handleInputChange} {...props} ref={ref} />
        {autoComplete.isOpen && (
          <Card
            display="flex"
            direction="column"
            maxH="lg"
            overflowX="hidden"
            overflowY="auto"
            position="absolute"
            top="100%"
            mt="1"
            right="0"
            left="0"
            zIndex={10}
          >
            {results.map(({ pubkey }) => (
              <UserOption key={pubkey} pubkey={pubkey} onClick={() => handleSelectUser(pubkey)} />
            ))}
          </Card>
        )}
      </Flex>
    );
  },
);

export default UserAutocomplete;
