import { Code, Flex, Heading, Link, Text } from "@chakra-ui/react";
import BackButton from "../../../components/router/back-button";
import useCurrentAccount from "../../../hooks/use-current-account";
import { useUserDNSIdentity } from "../../../hooks/use-user-dns-identity";
import { Link as RouterLink } from "react-router";

import { RelayFavicon } from "../../../components/relay-favicon";
import SimpleView from "../../../components/layout/presets/simple-view";

function RelayItem({ url }: { url: string }) {
  return (
    <Flex gap="2" alignItems="center">
      <RelayFavicon relay={url} size="sm" />
      <Link as={RouterLink} to={`/r/${encodeURIComponent(url)}`} isTruncated>
        {url}
      </Link>
    </Flex>
  );
}

export default function NIP05RelaysView() {
  const account = useCurrentAccount();
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

      {nip05?.relays?.map((url) => <RelayItem key={url} url={url} />)}
    </SimpleView>
  );
}
