import React, { useState } from "react";
import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { RelayUrlInput } from "../../components/relay-url-input";
import accountService from "../../services/account";
import { useDebounce } from "react-use";
import dnsIdentityService from "../../services/dns-identity";
import { CheckIcon } from "../../components/icons";
import { CloseIcon } from "@chakra-ui/icons";

export default function LoginNip05View() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [nip05, setNip05] = useState("");
  const [relayUrl, setRelayUrl] = useState("");

  const [pubkey, setPubkey] = useState<string | undefined>();
  const [relays, setRelays] = useState<string[] | undefined>();

  const handleNip05Change: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setNip05(event.target.value);
    setPubkey(undefined);
    setRelays(undefined);
    if (event.target.value) setLoading(true);
  };

  useDebounce(
    async () => {
      if (nip05) {
        try {
          const id = await dnsIdentityService.fetchIdentity(nip05);
          setPubkey(id?.pubkey);
          setRelays(id?.relays);
        } catch (e) {}
      }
      setLoading(false);
    },
    1000,
    [nip05, setPubkey, setRelays, setLoading],
  );

  const handleSubmit: React.FormEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    if (!pubkey) return toast({ status: "error", title: "Invalid NIP-05 id" });

    if ((!relays || relays.length === 0) && !relayUrl) {
      return toast({ status: "error", title: "No relay selected" });
    }

    // add the account if it dose not exist
    if (!accountService.hasAccount(pubkey)) {
      const bootstrapRelays = new Set<string>();

      if (relayUrl) bootstrapRelays.add(relayUrl);
      if (relays) {
        for (const url of relays) {
          bootstrapRelays.add(url);
        }
      }

      accountService.addAccount({ pubkey, relays: Array.from(bootstrapRelays), readonly: true });
    }

    accountService.switchAccount(pubkey);
  };

  const renderInputIcon = () => {
    if (loading) return <Spinner size="sm" />;
    if (nip05) {
      if (pubkey) return <CheckIcon color="green.500" />;
      else return <CloseIcon color="red.500" />;
    }
    return null;
  };

  return (
    <Flex as="form" direction="column" gap="4" onSubmit={handleSubmit} minWidth="350">
      <FormControl>
        <FormLabel>Enter user NIP-05 id</FormLabel>
        <InputGroup>
          <Input
            name="nip05"
            placeholder="user@domain.com"
            isRequired
            value={nip05}
            onChange={handleNip05Change}
            colorScheme={"green"}
            errorBorderColor={nip05 && !pubkey ? "red.500" : undefined}
          />
          <InputRightElement children={renderInputIcon()} />
        </InputGroup>
        <FormHelperText>
          Find NIP-05 ids here.{" "}
          <Link isExternal href="https://nostrplebs.com/directory" color="blue.500" target="_blank">
            nostrplebs.com/directory
          </Link>
        </FormHelperText>
      </FormControl>
      {relays ? (
        relays.length > 0 ? (
          <Text>
            Found {relays.length} relays <CheckIcon color="green.500" />
          </Text>
        ) : (
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
        )
      ) : null}
      <Flex justifyContent="space-between" gap="2">
        <Button variant="link" onClick={() => navigate("../")}>
          Back
        </Button>
        <Button colorScheme="brand" ml="auto" type="submit" isDisabled={!pubkey}>
          Login
        </Button>
      </Flex>
    </Flex>
  );
}
