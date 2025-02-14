import { Link, Text } from "@chakra-ui/react";
import { Identity, IdentityStatus } from "applesauce-loaders/helpers/dns-identity";
import { ExternalLinkIcon } from "../../../components/icons";

export default function DNSIdentityWarning({ identity, pubkey }: { pubkey: string; identity: Identity }) {
  switch (identity?.status) {
    case IdentityStatus.Missing:
      return <Text color="red.500">Unable to find DNS Identity in nostr.json file</Text>;
    case IdentityStatus.Error:
      return (
        <Text color="yellow.500">
          Unable to check DNS identity due to CORS error{" "}
          <Link
            color="blue.500"
            href={`https://cors-test.codehappy.dev/?url=${encodeURIComponent(`https://${identity.domain}/.well-known/nostr.json?name=${identity.name}`)}&method=get`}
            isExternal
          >
            Test
            <ExternalLinkIcon ml="1" />
          </Link>
        </Text>
      );
    case IdentityStatus.Found:
      if (identity.pubkey !== pubkey)
        return (
          <Text color="red.500" fontWeight="bold">
            Invalid DNS Identity!
          </Text>
        );
    default:
      return null;
  }
}
