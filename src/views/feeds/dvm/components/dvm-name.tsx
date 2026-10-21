import { Link, LinkProps, Text, TextProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { getDisplayName } from "../../../../helpers/nostr/profile";
import { AddressPointer } from "nostr-tools/nip19";
import useDVMMetadata from "../../../../hooks/use-dvm-metadata";
import useUserProfile from "../../../../hooks/use-user-profile";

export function DVMName({
  pointer,
  as = "span",
  ...props
}: TextProps & {
  pointer: AddressPointer;
}) {
  const metadata = useDVMMetadata(pointer);
  // Fall back per field to the author's profile while the handler loads or when it omits a name
  const profile = useUserProfile(pointer.pubkey);

  return (
    <Text as={as} {...props}>
      {metadata?.name || getDisplayName(profile, pointer.pubkey)}
    </Text>
  );
}

export default function DVMLink({
  pointer,
  ...props
}: LinkProps & {
  pointer: AddressPointer;
}) {
  return (
    <Link as={RouterLink} to={`/u/${nip19.npubEncode(pointer.pubkey)}`} whiteSpace="nowrap" {...props}>
      <DVMName pointer={pointer} />
    </Link>
  );
}
