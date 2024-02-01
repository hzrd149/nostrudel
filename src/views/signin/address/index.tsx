import { useState } from "react";
import { Button, Card, CardProps, Flex, FormControl, FormLabel, Image, Input, Text, useToast } from "@chakra-ui/react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useDebounce } from "react-use";

import dnsIdentityService, { DnsIdentity } from "../../../services/dns-identity";
import { CheckIcon } from "../../../components/icons";
import nostrConnectService from "../../../services/nostr-connect";
import accountService from "../../../services/account";
import { COMMON_CONTACT_RELAY } from "../../../const";
import { safeRelayUrls } from "../../../helpers/relay";

export default function LoginNostrAddressView() {
  const navigate = useNavigate();
  const toast = useToast();

  const [provider, setProvider] = useState("");
  const [address, setAddress] = useState("");
  const userSpecifiedDomain = address.includes("@");

  const fullAddress = userSpecifiedDomain ? address || undefined : provider ? address + "@" + provider : undefined;

  const [rootNip05, setRootNip05] = useState<DnsIdentity>();
  const [nip05, setNip05] = useState<DnsIdentity>();
  useDebounce(
    async () => {
      if (!fullAddress) return setNip05(undefined);
      let [name, domain] = fullAddress.split("@");
      if (!name || !domain || !domain.includes(".")) return setNip05(undefined);
      setNip05(await dnsIdentityService.fetchIdentity(fullAddress));
      setRootNip05(await dnsIdentityService.fetchIdentity(`_@${domain}`));
    },
    300,
    [fullAddress],
  );

  const [loading, setLoading] = useState<string | undefined>();
  const connect: React.FormEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    if (!nip05) return;

    try {
      if (nip05.hasNip46) {
        setLoading("Connecting...");
        const relays = safeRelayUrls(nip05.nip46Relays || rootNip05?.nip46Relays || rootNip05?.relays || nip05.relays);
        const client = nostrConnectService.fromHostedBunker(nip05.pubkey, relays, rootNip05?.pubkey);
        client.onAuthURL.subscribe((url) => {
          window.open(url, "auth", "width=400,height=600,resizable=no,status=no,location=no,toolbar=no,menubar=no");
        });
        await client.connect();

        nostrConnectService.saveClient(client);
        accountService.addAccount({
          type: "nostr-connect",
          signerRelays: client.relays,
          clientSecretKey: client.secretKey,
          pubkey: client.pubkey!,
          readonly: false,
        });
        accountService.switchAccount(client.pubkey!);
      } else {
        accountService.addAccount({
          type: "pubkey",
          pubkey: nip05.pubkey,
          relays: [...nip05.relays, COMMON_CONTACT_RELAY],
          readonly: true,
        });
        accountService.switchAccount(nip05.pubkey);
      }
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
    setLoading(undefined);
  };

  const renderStatus = () => {
    if (!address) return null;

    const cardProps: CardProps = {
      variant: "outline",
      p: "2",
      flexDirection: "row",
      gap: "2",
      alignItems: "center",
      flexWrap: "wrap",
    };

    if (nip05) {
      if (nip05.hasNip46) {
        return (
          <Card {...cardProps}>
            <Image w="7" h="7" src={`//${nip05.domain}/favicon.ico`} />
            <Text fontWeight="bold">{fullAddress}</Text>
            <Text color="green.500" ml="auto">
              Found provider <CheckIcon boxSize={5} />
            </Text>
          </Card>
        );
      } else
        return (
          <Card {...cardProps}>
            <Text fontWeight="bold">{fullAddress}</Text>
            <Text color="yellow.500" ml="auto">
              Read-only
            </Text>
          </Card>
        );
    } else {
      return (
        <Card {...cardProps}>
          <Text fontWeight="bold">{fullAddress}</Text>
          <Text color="red.500" ml="auto">
            Cant find identity
          </Text>
        </Card>
      );
    }
  };

  return (
    <Flex as="form" direction="column" gap="2" onSubmit={connect} w="full">
      {loading && <Text fontSize="lg">{loading}</Text>}
      {!loading && (
        <>
          <FormControl>
            <FormLabel htmlFor="address">Nostr Address</FormLabel>
            <Flex gap="2">
              <Input
                id="address"
                type="email"
                isRequired
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoComplete="off"
              />
            </Flex>
          </FormControl>
          {renderStatus()}
        </>
      )}
      <Flex justifyContent="space-between" gap="2" mt="2">
        <Button variant="link" onClick={() => navigate("../")}>
          Back
        </Button>
        {nip05 ? (
          <Button colorScheme="primary" ml="auto" type="submit" isLoading={!!loading} isDisabled={!nip05}>
            Connect
          </Button>
        ) : (
          <Button colorScheme="primary" ml="auto" as={RouterLink} to="/signin/address/create">
            Find Provider
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
