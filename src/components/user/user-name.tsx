import { Text, TextProps } from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";
import { memo } from "react";

import { getDisplayName } from "../../helpers/nostr/profile";
import useAppSettings from "../../hooks/use-user-app-settings";
import useUserProfile from "../../hooks/use-user-profile";
import localSettings from "../../services/preferences";

function UserName({ pubkey, ...props }: Omit<TextProps, "children"> & { pubkey: string }) {
  const metadata = useUserProfile(pubkey);
  const { removeEmojisInUsernames, showPubkeyColor } = useAppSettings();
  const color = "#" + pubkey.slice(0, 6);

  const hideUsernames = useObservableEagerState(localSettings.hideUsernames);

  return (
    <Text
      as="span"
      whiteSpace="nowrap"
      fontWeight="bold"
      textDecoration={showPubkeyColor === "underline" ? `underline ${color} solid 2px` : undefined}
      {...props}
    >
      {hideUsernames ? "Anon" : getDisplayName(metadata, pubkey, removeEmojisInUsernames)}
    </Text>
  );
}

export default memo(UserName);
