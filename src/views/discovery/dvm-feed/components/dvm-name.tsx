import { Link, LinkProps, Text, TextProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { nip19 } from "nostr-tools";

import useUserMetadata from "../../../../hooks/use-user-metadata";
import { getDisplayName } from "../../../../helpers/nostr/user-metadata";
import { AddressPointer } from "nostr-tools/nip19";
import useDVMMetadata from "../../../../hooks/use-dvm-metadata";

export function DVMName({
  pointer,
  as = "span",
  ...props
}: TextProps & {
  pointer: AddressPointer;
}) {
  const dvmMetadata = useDVMMetadata(pointer);
  const metadata = useUserMetadata(pointer.pubkey);

  return (
    <Text as={as} {...props}>
      {dvmMetadata?.name || getDisplayName(metadata, pointer.pubkey)}
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
