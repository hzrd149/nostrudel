import { memo } from "react";
import { Text, TextProps } from "@chakra-ui/react";

import { getDisplayName } from "../../helpers/nostr/user-metadata";
import useUserMetadata from "../../hooks/use-user-metadata";
import useAppSettings from "../../hooks/use-app-settings";

function UserName({ pubkey, ...props }: Omit<TextProps, "children"> & { pubkey: string }) {
  const metadata = useUserMetadata(pubkey);
  const { hideUsernames, removeEmojisInUsernames } = useAppSettings();

  return (
    <Text as="span" whiteSpace="nowrap" fontWeight="bold" {...props}>
      {hideUsernames ? "Anon" : getDisplayName(metadata, pubkey, removeEmojisInUsernames)}
    </Text>
  );
}

export default memo(UserName);
