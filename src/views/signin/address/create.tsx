import { useMemo, useState } from "react";
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
  Link,
  LinkBox,
  Tag,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { NostrEvent } from "nostr-tools";
import { NostrConnectSigner } from "applesauce-signer/signers/nostr-connect-signer";
import { ProfileContent } from "applesauce-core/helpers";

import useNip05Providers from "../../../hooks/use-nip05-providers";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import { getEventCoordinate } from "../../../helpers/nostr/event";
import { MetadataAvatar } from "../../../components/user/user-avatar";
import { ErrorBoundary } from "../../../components/error-boundary";
import dnsIdentityService from "../../../services/dns-identity";
import useUserProfile from "../../../hooks/use-user-profile";
import accountService from "../../../services/account";
import { safeRelayUrls } from "../../../helpers/relay";
import { safeJson } from "../../../helpers/parse";
import { NOSTR_CONNECT_PERMISSIONS } from "../../../const";
import NostrConnectAccount from "../../../classes/accounts/nostr-connect-account";
import relayPoolService from "../../../services/relay-pool";

function ProviderCard({ onClick, provider }: { onClick: () => void; provider: NostrEvent }) {
  const metadata = JSON.parse(provider.content) as ProfileContent;
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
  const userMetadata = useUserProfile(selected?.pubkey);
  const providerMetadata = useMemo<ProfileContent | undefined>(
    () => selected && safeJson(selected.content, undefined),
    [selected],
  );

  const createAccount: React.FormEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    if (!selected || !name) return;

    try {
      setLoading("Creating...");
      const metadata: ProfileContent = { ...userMetadata, ...providerMetadata };
      if (!metadata.nip05) throw new Error("Provider missing nip05 address");
      const nip05 = await dnsIdentityService.fetchIdentity(metadata.nip05);
      if (!nip05 || nip05.pubkey !== selected.pubkey) throw new Error("Invalid provider");
      if (nip05.name !== "_") throw new Error("Provider does not own the domain");
      if (!nip05.hasNip46) throw new Error("Provider does not support NIP-46");
      const relays = safeRelayUrls(nip05.nip46Relays || nip05.relays || []);
      if (relays.length === 0) throw new Error("Cant find providers relays");

      const signer = new NostrConnectSigner({ pool: relayPoolService, relays, remote: nip05.pubkey });

      const createPromise = signer.createAccount(name, nip05.domain, undefined, NOSTR_CONNECT_PERMISSIONS);
      await createPromise;
      await signer.connect(undefined, NOSTR_CONNECT_PERMISSIONS);

      const account = new NostrConnectAccount(signer.pubkey!, signer);

      accountService.addAccount(account);
      accountService.switchAccount(account.pubkey);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
    setLoading(undefined);
  };

  const renderContent = () => {
    if (loading) return <Text fontSize="lg">{loading}</Text>;

    if (selected) {
      const metadata = JSON.parse(selected.content) as ProfileContent;
      const [_, domain] = metadata.nip05!.split("@");

      return (
        <>
          <div>
            <Flex gap="2" alignItems="center">
              <MetadataAvatar metadata={metadata} size="sm" />
              <Heading size="sm">{metadata.displayName || metadata.name}</Heading>
            </Flex>
            <Link href={providerMetadata?.website || userMetadata?.website} isExternal color="blue.500">
              {providerMetadata?.website || userMetadata?.website}
            </Link>
          </div>
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
