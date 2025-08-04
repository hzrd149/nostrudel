import { Link, LinkProps } from "@chakra-ui/react";
import { useActiveAccount, useObservableEagerState } from "applesauce-react/hooks";
import { npubEncode } from "nostr-tools/nip19";
import { Link as RouterLink } from "react-router-dom";

import { getDisplayName } from "../../helpers/nostr/profile";
import useAppSettings from "../../hooks/use-user-app-settings";
import useUserProfile from "../../hooks/use-user-profile";
import localSettings from "../../services/preferences";

export type UserLinkProps = Omit<LinkProps, "children"> & {
  pubkey: string;
  showAt?: boolean;
  tab?: string;
  relays?: string[];
};

export default function UserLink({ pubkey, showAt, tab, relays, ...props }: UserLinkProps) {
  const metadata = useUserProfile({ pubkey, relays });
  const account = useActiveAccount();
  const { removeEmojisInUsernames, showPubkeyColor } = useAppSettings();
  const hideUsernames = useObservableEagerState(localSettings.hideUsernames);
  const color = "#" + pubkey.slice(0, 6);

  return (
    <Link
      as={RouterLink}
      to={`/u/${npubEncode(pubkey)}` + (tab ? "/" + tab : "")}
      whiteSpace="nowrap"
      textDecoration={showPubkeyColor === "underline" ? `underline ${color} solid 2px` : undefined}
      {...props}
    >
      {showAt && "@"}
      {hideUsernames && pubkey !== account?.pubkey ? "Anon" : getDisplayName(metadata, pubkey, removeEmojisInUsernames)}
    </Link>
  );
}
