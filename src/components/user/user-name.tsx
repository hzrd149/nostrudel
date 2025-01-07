import { memo } from "react";
import { Text, TextProps } from "@chakra-ui/react";

import { getDisplayName } from "../../helpers/nostr/profile";
import useUserProfile from "../../hooks/use-user-profile";
import useAppSettings from "../../hooks/use-user-app-settings";

function UserName({ pubkey, ...props }: Omit<TextProps, "children"> & { pubkey: string }) {
  const metadata = useUserProfile(pubkey);
  const { hideUsernames, removeEmojisInUsernames } = useAppSettings();

  return (
    <Text as="span" whiteSpace="nowrap" fontWeight="bold" {...props}>
      {hideUsernames ? "Anon" : getDisplayName(metadata, pubkey, removeEmojisInUsernames)}
    </Text>
  );
}

export default memo(UserName);
