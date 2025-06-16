import { Link, LinkProps } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { Link as RouterLink } from "react-router-dom";
import { npubEncode } from "nostr-tools/nip19";

import { getDisplayName } from "../../helpers/nostr/profile";
import useAppSettings from "../../hooks/use-user-app-settings";
import useUserProfile from "../../hooks/use-user-profile";

export type UserLinkProps = LinkProps & {
  pubkey: string;
  showAt?: boolean;
  tab?: string;
  relays?: string[];
};

export default function UserLink({ pubkey, showAt, tab, relays, ...props }: UserLinkProps) {
  const metadata = useUserProfile({ pubkey, relays });
  const account = useActiveAccount();
  const { hideUsernames, removeEmojisInUsernames, showPubkeyColor } = useAppSettings();
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
