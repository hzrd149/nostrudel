import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputRightAddon,
  LinkBox,
  Tag,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { NostrEvent } from "nostr-tools";

import useNip05Providers from "../../../hooks/use-nip05-providers";
import { Kind0ParsedContent } from "../../../helpers/user-metadata";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import { getEventCoordinate } from "../../../helpers/nostr/events";
import { MetadataAvatar } from "../../../components/user-avatar";
import { ErrorBoundary } from "../../../components/error-boundary";
import dnsIdentityService from "../../../services/dns-identity";
import { useUserMetadata } from "../../../hooks/use-user-metadata";
import nostrConnectService from "../../../services/nostr-connect";
import accountService from "../../../services/account";

function ProviderCard({ onClick, provider }: { onClick: () => void; provider: NostrEvent }) {
  const metadata = JSON.parse(provider.content) as Kind0ParsedContent;
  const features = provider.tags.filter((t) => t[0] === "f").map((t) => t[1]);

  if (!metadata.nip05) return null;

  return (
    <Card as={LinkBox}>
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <MetadataAvatar metadata={metadata} size="sm" />
        <HoverLinkOverlay onClick={onClick} cursor="pointer">
          <Heading size="sm">{metadata.displayName || metadata.name}</Heading>
        </HoverLinkOverlay>
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text>{metadata.about}</Text>
        {features.length > 0 && (
          <Flex gap="2" mt="2">
            {features.map((f) => (
              <Tag key={f} colorScheme="primary">
                {f}
              </Tag>
            ))}
          </Flex>
        )}
      </CardBody>
    </Card>
  );
}

export default function LoginNostrAddressCreate() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState<string>();
  const [name, setName] = useState("");
  const providers = useNip05Providers();
  const [selected, setSelected] = useState<NostrEvent>();
  const metadata = useUserMetadata(selected?.pubkey);

  const createAccount: React.FormEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    if (!selected || !name) return;

    try {
      setLoading("Creating...");
      if (!metadata) throw new Error("Cant verify provider");
      if (!metadata.nip05) throw new Error("Provider missing nip05 address");
      const nip05 = await dnsIdentityService.fetchIdentity(metadata.nip05);
      if (!nip05 || nip05.pubkey !== selected.pubkey) throw new Error("Invalid provider");
      if (nip05.name !== "_") throw new Error("Provider dose not own the domain");
      if (!nip05.hasNip46) throw new Error("Provider dose not support NIP-46");

      const client = nostrConnectService.createClient("", nip05.nip46Relays || nip05.relays, undefined, nip05.pubkey);
      client.onAuthURL.subscribe((url) => {
        window.open(url, "auth", "width=400,height=600,resizable=no,status=no,location=no,toolbar=no,menubar=no");
      });

      const newPubkey = await client.createAccount(name, nip05.domain);

      await client.connect();

      nostrConnectService.saveClient(client);
      accountService.addAccount({
        type: "nostr-connect",
        signerRelays: client.relays,
        clientSecretKey: client.secretKey,
        pubkey: client.pubkey,
        readonly: false,
      });
      accountService.switchAccount(client.pubkey!);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
    setLoading(undefined);
  };

  const renderContent = () => {
    if (loading) return <Text fontSize="lg">{loading}</Text>;

    if (selected) {
      const metadata = JSON.parse(selected.content) as Kind0ParsedContent;
      const [_, domain] = metadata.nip05!.split("@");

      return (
        <>
          <Flex gap="2" alignItems="center">
            <MetadataAvatar metadata={metadata} size="sm" />
            <Heading size="sm">{metadata.displayName || metadata.name}</Heading>
          </Flex>
          <InputGroup>
            <Input name="name" isRequired value={name} onChange={(e) => setName(e.target.value)} />
            <InputRightAddon as="button" onClick={() => setSelected(undefined)} cursor="pointer">
              @{domain}
            </InputRightAddon>
          </InputGroup>
        </>
      );
    }

    return (
      <>
        {providers.map((p) => (
          <ErrorBoundary key={getEventCoordinate(p)}>
            <ProviderCard provider={p} onClick={() => setSelected(p)} />
          </ErrorBoundary>
        ))}
      </>
    );
  };

  return (
    <Flex as="form" direction="column" gap="2" onSubmit={createAccount} w="full">
      {renderContent()}
      <Flex justifyContent="space-between" gap="2" mt="2">
        <Button variant="link" onClick={() => navigate("../")}>
          Back
        </Button>
        <Button colorScheme="primary" ml="auto" type="submit" isLoading={!!loading} isDisabled={!selected}>
          Create Account
        </Button>
      </Flex>
    </Flex>
  );
}
