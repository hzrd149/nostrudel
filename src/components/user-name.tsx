import { Text, TextProps } from "@chakra-ui/react";

import { getUserDisplayName } from "../helpers/user-metadata";
import { useUserMetadata } from "../hooks/use-user-metadata";
import useAppSettings from "../hooks/use-app-settings";

export default function UserName({ pubkey, ...props }: Omit<TextProps, "children"> & { pubkey: string }) {
  const metadata = useUserMetadata(pubkey);
  const { hideUsernames } = useAppSettings();

  return (
    <Text as="span" whiteSpace="nowrap" fontWeight="bold" {...props}>
      {hideUsernames ? "Anon" : getUserDisplayName(metadata, pubkey)}
    </Text>
  );
}
