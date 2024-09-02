import { Text, TextProps, Tooltip } from "@chakra-ui/react";

import useUserMetadata from "../../hooks/use-user-metadata";
import UserDnsIdentityIcon from "./user-dns-identity-icon";

export default function UserDnsIdentity({
  pubkey,
  onlyIcon,
  ...props
}: { pubkey: string; onlyIcon?: boolean } & Omit<TextProps, "children">) {
  const metadata = useUserMetadata(pubkey);
  if (!metadata?.nip05) return null;

  if (onlyIcon) {
    return (
      <Tooltip label={metadata.nip05}>
        <UserDnsIdentityIcon pubkey={pubkey} />
      </Tooltip>
    );
  }
  return (
    <Text as="span" whiteSpace="nowrap" {...props}>
      {metadata.nip05.startsWith("_@") ? metadata.nip05.substr(2) : metadata.nip05}{" "}
      <UserDnsIdentityIcon pubkey={pubkey} />
    </Text>
  );
}
