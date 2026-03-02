import { useState } from "react";
import { Button, Flex, FormControl, FormLabel, Input } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAccountManager } from "applesauce-react/hooks";
import { ReadonlyAccount } from "applesauce-accounts/accounts";
import { ReadonlySigner } from "applesauce-signers";
import { useDebounce } from "react-use";

import { normalizeToHexPubkey } from "../../helpers/nip19";
import QRCodeScannerButton from "../../components/qr-code/qr-code-scanner-button";
import { lookupUsers, SearchResult } from "../../services/user-lookup";
import UserAvatar from "../../components/user/user-avatar";
import UserName from "../../components/user/user-name";

function UserResult({ pubkey, onSelect }: { pubkey: string; onSelect: (pubkey: string) => void }) {
  return (
    <Flex
      p="2"
      gap="3"
      alignItems="center"
      cursor="pointer"
      borderRadius="md"
      _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
      onClick={() => onSelect(pubkey)}
    >
      <UserAvatar pubkey={pubkey} size="sm" />
      <UserName fontWeight="bold" pubkey={pubkey} />
    </Flex>
  );
}

export default function SigninNpubView() {
  const navigate = useNavigate();
  const manager = useAccountManager();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  useDebounce(
    () => {
      if (!query || query.length < 2) {
        setResults([]);
        return;
      }

      // If it resolves directly to a pubkey, show that user immediately
      const pubkey = normalizeToHexPubkey(query);
      if (pubkey) {
        setResults([{ pubkey, relays: [], query }]);
        return;
      }

      lookupUsers(query, 5).then(setResults);
    },
    300,
    [query],
  );

  const loginAs = (pubkey: string) => {
    const account = new ReadonlyAccount(pubkey, new ReadonlySigner(pubkey));
    manager.addAccount(account);
    manager.setActive(account);
  };

  return (
    <Flex direction="column" gap="4" w="full">
      <FormControl>
        <FormLabel>Search for an account</FormLabel>
        <Flex gap="2">
          <Input
            type="text"
            placeholder="Name, npub, or hex key"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <QRCodeScannerButton onResult={(v) => setQuery(v)} />
        </Flex>
      </FormControl>

      {results.length > 0 && (
        <Flex direction="column" gap="1">
          {results.slice(0, 5).map(({ pubkey }) => (
            <UserResult key={pubkey} pubkey={pubkey} onSelect={loginAs} />
          ))}
        </Flex>
      )}

      <Button variant="link" onClick={() => navigate("../")} alignSelf="flex-start">
        Back
      </Button>
    </Flex>
  );
}
