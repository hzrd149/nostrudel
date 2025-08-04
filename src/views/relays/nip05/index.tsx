import { Code, Flex, Link, Text } from "@chakra-ui/react";
import { IdentityStatus } from "applesauce-loaders/helpers/dns-identity";
import { useActiveAccount } from "applesauce-react/hooks";
import { Link as RouterLink } from "react-router-dom";

import SimpleView from "../../../components/layout/presets/simple-view";
import RelayFavicon from "../../../components/relay/relay-favicon";
import { useUserDNSIdentity } from "../../../hooks/use-user-dns-identity";

function RelayItem({ url }: { url: string }) {
  return (
    <Flex gap="2" alignItems="center">
      <RelayFavicon relay={url} size="sm" />
      <Link as={RouterLink} to={`/relays/${encodeURIComponent(url)}`} isTruncated>
        {url}
      </Link>
    </Flex>
  );
}

export default function NIP05RelaysView() {
  const account = useActiveAccount();
  const nip05 = useUserDNSIdentity(account?.pubkey);

  return (
    <SimpleView title="NIP-05 Relays">
      <Text fontStyle="italic" mt="-2">
        These relays cant be modified by noStrudel, they must be set manually on your{" "}
        <Code>/.well-known/nostr.json</Code> file or by your identity provider
        <br />
        <Link
          href="https://nostr.how/en/guides/get-verified#self-hosted"
          isExternal
          color="blue.500"
          fontStyle="initial"
        >
          Read more about nip-05
        </Link>
      </Text>

      {nip05?.status === IdentityStatus.Found && nip05?.relays?.map((url) => <RelayItem key={url} url={url} />)}
    </SimpleView>
  );
}
