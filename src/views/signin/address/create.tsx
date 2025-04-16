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
import { NostrConnectSigner } from "applesauce-signers/signers/nostr-connect-signer";
import { mergeRelaySets, parseNIP05Address, ProfileContent, safeParse } from "applesauce-core/helpers";
import { useAccountManager } from "applesauce-react/hooks";
import { NostrConnectAccount } from "applesauce-accounts/accounts";
import { IdentityStatus } from "applesauce-loaders/helpers/dns-identity";

import { NOSTR_CONNECT_PERMISSIONS } from "../../../const";
import useNip05Providers from "../../../hooks/use-nip05-providers";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import { getEventCoordinate } from "../../../helpers/nostr/event";
import { MetadataAvatar } from "../../../components/user/user-avatar";
import { ErrorBoundary } from "../../../components/error-boundary";
import dnsIdentityLoader from "../../../services/dns-identity-loader";
import useUserProfile from "../../../hooks/use-user-profile";

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

export default function SigninNostrAddressCreate() {
  const navigate = useNavigate();
  const toast = useToast();

  const manager = useAccountManager();
  const [loading, setLoading] = useState<string>();
  const [name, setName] = useState("");
  const providers = useNip05Providers();
  const [selected, setSelected] = useState<NostrEvent>();
  const userMetadata = useUserProfile(selected?.pubkey);
  const providerMetadata = useMemo<ProfileContent | undefined>(
    () => selected && safeParse(selected.content),
    [selected],
  );

  const createAccount: React.FormEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    if (!selected || !name) return;

    try {
      setLoading("Creating...");
      const metadata: ProfileContent = { ...userMetadata, ...providerMetadata };
      if (!metadata.nip05) throw new Error("Provider missing nip05 address");
      const { name, domain } = parseNIP05Address(metadata.nip05) || {};
      if (!name || !domain) throw new Error("Invalid DNS identity");
      const identity = await dnsIdentityLoader.requestIdentity(name, domain);
      if (identity.status === IdentityStatus.Error) throw new Error("Failed to fetch identity");
      if (identity.status === IdentityStatus.Missing) throw new Error("Cant find identity");
      if (identity.pubkey !== selected.pubkey) throw new Error("Invalid provider");

      if (identity.name !== "_") throw new Error("Provider does not own the domain");
      if (!identity.hasNip46) throw new Error("Provider does not support NIP-46");
      const relays = mergeRelaySets(identity.nip46Relays || identity.relays || []);
      if (relays.length === 0) throw new Error("Cant find providers relays");

      const signer = new NostrConnectSigner({ relays, remote: identity.pubkey });

      const createPromise = signer.createAccount(name, identity.domain, undefined, NOSTR_CONNECT_PERMISSIONS);
      await createPromise;
      await signer.connect(undefined, NOSTR_CONNECT_PERMISSIONS);

      const pubkey = await signer.getPublicKey();
      const account = new NostrConnectAccount(pubkey, signer);

      manager.addAccount(account);
      manager.setActive(account);
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
