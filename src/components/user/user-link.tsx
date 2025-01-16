import { Link, LinkProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router";
import { nip19 } from "nostr-tools";

import { getDisplayName } from "../../helpers/nostr/profile";
import useUserProfile from "../../hooks/use-user-profile";
import useAppSettings from "../../hooks/use-user-app-settings";
import useCurrentAccount from "../../hooks/use-current-account";

export type UserLinkProps = LinkProps & {
  pubkey: string;
  showAt?: boolean;
  tab?: string;
  relays?: string[];
};

export default function UserLink({ pubkey, showAt, tab, relays, ...props }: UserLinkProps) {
  const metadata = useUserProfile(pubkey, relays);
  const account = useCurrentAccount();
  const { hideUsernames, removeEmojisInUsernames, showPubkeyColor } = useAppSettings();
  const color = "#" + pubkey.slice(0, 6);

  return (
    <Link
      as={RouterLink}
      to={`/u/${nip19.npubEncode(pubkey)}` + (tab ? "/" + tab : "")}
      whiteSpace="nowrap"
      textDecoration={showPubkeyColor === "underline" ? `underline ${color} solid 2px` : undefined}
      {...props}
    >
      {showAt && "@"}
      {hideUsernames && pubkey !== account?.pubkey ? "Anon" : getDisplayName(metadata, pubkey, removeEmojisInUsernames)}
    </Link>
  );
}
