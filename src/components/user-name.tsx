import { Text, TextProps } from "@chakra-ui/react";

import { getUserDisplayName } from "../helpers/user-metadata";
import { useUserMetadata } from "../hooks/use-user-metadata";

export default function UserName({ pubkey, ...props }: Omit<TextProps, "children"> & { pubkey: string }) {
  const metadata = useUserMetadata(pubkey);

  return (
    <Text as="span" whiteSpace="nowrap" fontWeight="bold" {...props}>
      {getUserDisplayName(metadata, pubkey)}
    </Text>
  );
}
