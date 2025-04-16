import { useState } from "react";
import { Button, Card, CardProps, Flex, FormControl, FormLabel, Image, Input, Text, useToast } from "@chakra-ui/react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { NostrConnectSigner } from "applesauce-signers/signers/nostr-connect-signer";
import { useAccountManager } from "applesauce-react/hooks";
import { NostrConnectAccount, ReadonlyAccount } from "applesauce-accounts/accounts";
import { Identity, IdentityStatus } from "applesauce-loaders/helpers/dns-identity";
import { mergeRelaySets } from "applesauce-core/helpers";
import { ReadonlySigner } from "applesauce-signers";
import { useDebounce } from "react-use";

import dnsIdentityLoader from "../../../services/dns-identity-loader";
import { CheckIcon } from "../../../components/icons";
import { NOSTR_CONNECT_PERMISSIONS } from "../../../const";
import { getMatchSimpleEmail } from "../../../helpers/regexp";
import QRCodeScannerButton from "../../../components/qr-code/qr-code-scanner-button";

export default function SigninNostrAddressView() {
  const navigate = useNavigate();
  const toast = useToast();
  const manager = useAccountManager();

  const [address, setAddress] = useState("");

  const [nip05, setNip05] = useState<Identity | null>();
  const [_rootNip05, setRootNip05] = useState<Identity | null>();
  useDebounce(
    async () => {
      if (!address) return setNip05(undefined);
      if (!getMatchSimpleEmail().test(address)) return setNip05(undefined);
      const [name, domain] = address.split("@");
      if (!name || !domain) return setNip05(undefined);
      setNip05((await dnsIdentityLoader.fetchIdentity(name, domain)) ?? null);
      setRootNip05((await dnsIdentityLoader.fetchIdentity("_", domain)) ?? null);
    },
    300,
    [address],
  );

  const [loading, setLoading] = useState<string | undefined>();
  const connect: React.FormEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    if (nip05?.status !== IdentityStatus.Found) return;

    try {
      if (nip05.hasNip46 && nip05.pubkey) {
        setLoading("Connecting...");
        const relays = mergeRelaySets(nip05.nip46Relays || nip05.relays || []);
        const signer = new NostrConnectSigner({
          pubkey: nip05.pubkey,
          relays,
        });
        await signer.connect(undefined, NOSTR_CONNECT_PERMISSIONS);

        const pubkey = await signer.getPublicKey();
        const account = new NostrConnectAccount(pubkey, signer);
        manager.addAccount(account);
        manager.setActive(account);
      } else if (nip05.pubkey) {
        const account = new ReadonlyAccount(nip05.pubkey, new ReadonlySigner(nip05.pubkey));
        manager.addAccount(account);
        manager.setActive(account);
      } else throw Error("Cant find address");
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

    if (nip05?.status === IdentityStatus.Found) {
      if (nip05.hasNip46) {
        return (
          <Card {...cardProps}>
            <Image w="7" h="7" src={`//${nip05.domain}/favicon.ico`} />
            <Text fontWeight="bold">{address}</Text>
            <Text color="green.500" ml="auto">
              Found provider <CheckIcon boxSize={5} />
            </Text>
          </Card>
        );
      } else
        return (
          <Card {...cardProps}>
            <Text fontWeight="bold">{address}</Text>
            <Text color="yellow.500" ml="auto">
              Read-only
            </Text>
          </Card>
        );
    } else if (nip05 === null) {
      return (
        <Card {...cardProps}>
          <Text fontWeight="bold">{address}</Text>
          <Text color="red.500" ml="auto">
            Cant find identity
          </Text>
        </Card>
      );
    }

    return null;
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
              <QRCodeScannerButton onResult={(v) => setAddress(v)} />
            </Flex>
          </FormControl>
          {renderStatus()}
        </>
      )}
      <Flex gap="2" mt="2">
        <Button variant="link" onClick={() => navigate("../")} mr="auto">
          Back
        </Button>
        {!loading && (
          <Button colorScheme="primary" as={RouterLink} to="/signin/address/create" variant="link" p="2">
            Find Provider
          </Button>
        )}
        <Button colorScheme="primary" type="submit" isLoading={!!loading} isDisabled={!nip05}>
          Connect
        </Button>
      </Flex>
    </Flex>
  );
}
