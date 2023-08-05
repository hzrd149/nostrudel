import { useCallback, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Link,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { RelayUrlInput } from "../../components/relay-url-input";
import { Bech32Prefix, normalizeToBech32, normalizeToHex } from "../../helpers/nip19";
import accountService from "../../services/account";
import clientRelaysService from "../../services/client-relays";
import { generatePrivateKey, getPublicKey } from "nostr-tools";
import signingService from "../../services/signing";

export default function LoginNsecView() {
  const navigate = useNavigate();

  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const [hexKey, setHexKey] = useState("");
  const [relayUrl, setRelayUrl] = useState("");

  const [npub, setNpub] = useState("");

  const generateNewKey = useCallback(() => {
    const hex = generatePrivateKey();
    const pubkey = getPublicKey(hex);
    setHexKey(hex);
    setInputValue(normalizeToBech32(hex, Bech32Prefix.SecKey) ?? "");
    setNpub(normalizeToBech32(pubkey, Bech32Prefix.Pubkey) ?? "");
    setShow(true);
  }, [setHexKey, setInputValue, setShow]);

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      setInputValue(e.target.value);

      try {
        const hex = normalizeToHex(e.target.value);
        if (hex) {
          const pubkey = getPublicKey(hex);
          setHexKey(hex);
          setNpub(normalizeToBech32(pubkey, Bech32Prefix.Pubkey) ?? "");
          setError(false);
        } else {
          setError(true);
        }
      } catch (e) {
        setError(true);
      }
    },
    [setInputValue, setHexKey, setNpub, setError]
  );

  const handleSubmit: React.FormEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();

    if (!hexKey) return;
    const pubkey = getPublicKey(hexKey);

    const encrypted = await signingService.encryptSecKey(hexKey);
    accountService.addAccount({ pubkey, relays: [relayUrl], ...encrypted, readonly: false });
    clientRelaysService.bootstrapRelays.add(relayUrl);
    accountService.switchAccount(pubkey);
  };

  return (
    <Flex as="form" direction="column" gap="4" onSubmit={handleSubmit} minWidth="350">
      <Alert status="warning" maxWidth="30rem">
        <AlertIcon />
        <Box>
          <AlertTitle>Using nsec keys is insecure.</AlertTitle>
          <AlertDescription>
            You should use a browser extension like{" "}
            <Link isExternal href="https://getalby.com/" target="_blank">
              Alby
            </Link>
            {", "}
            <Link isExternal href="https://github.com/susumuota/nostr-keyx" target="_blank">
              nostr-keyx
            </Link>
            {" or "}
            <Link
              isExternal
              href="https://chrome.google.com/webstore/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp"
              target="_blank"
            >
              Nos2x
            </Link>
          </AlertDescription>
        </Box>
      </Alert>

      <FormControl>
        <FormLabel>Enter user secret key (nsec)</FormLabel>
        <InputGroup size="md">
          <Input
            pr="4.5rem"
            type={show ? "text" : "password"}
            placeholder="nsec or hex"
            isRequired
            value={inputValue}
            onChange={handleInputChange}
            isInvalid={error}
          />
          <InputRightElement width="4.5rem">
            <Button h="1.75rem" size="sm" onClick={() => setShow((v) => !v)}>
              {show ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>

      <FormControl>
        <FormLabel>Pubkey Key (npub)</FormLabel>
        <Input type="text" readOnly isDisabled value={npub} />
      </FormControl>

      <FormControl>
        <FormLabel>Bootstrap relay</FormLabel>
        <RelayUrlInput
          placeholder="wss://nostr.example.com"
          isRequired
          value={relayUrl}
          onChange={(url) => setRelayUrl(url)}
        />
        <FormHelperText>The first relay to connect to.</FormHelperText>
      </FormControl>
      <Flex justifyContent="space-between" gap="2">
        <Button variant="link" onClick={() => navigate("../")}>
          Back
        </Button>
        <Button ml="auto" onClick={generateNewKey}>
          Generate New
        </Button>
        <Button colorScheme="brand" type="submit">
          Login
        </Button>
      </Flex>
    </Flex>
  );
}
