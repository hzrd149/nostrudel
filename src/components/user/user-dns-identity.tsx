import { Text, Tooltip } from "@chakra-ui/react";

import useUserMetadata from "../../hooks/use-user-metadata";
import UserDnsIdentityIcon from "./user-dns-identity-icon";

export default function UserDnsIdentity({ pubkey, onlyIcon }: { pubkey: string; onlyIcon?: boolean }) {
  const metadata = useUserMetadata(pubkey);
  if (!metadata?.nip05) {
    return null;
  }

  if (onlyIcon) {
    return (
      <Tooltip label={metadata.nip05}>
        <UserDnsIdentityIcon pubkey={pubkey} />
      </Tooltip>
    );
  }
  return (
    <Text as="span" whiteSpace="nowrap">
      {metadata.nip05.startsWith("_@") ? metadata.nip05.substr(2) : metadata.nip05}{" "}
      <UserDnsIdentityIcon pubkey={pubkey} />
    </Text>
  );
}
