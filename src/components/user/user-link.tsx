import { Link, LinkProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { getDisplayName } from "../../helpers/nostr/user-metadata";
import useUserMetadata from "../../hooks/use-user-metadata";
import useAppSettings from "../../hooks/use-app-settings";
import useCurrentAccount from "../../hooks/use-current-account";
import useSubject from "../../hooks/use-subject";
import localSettings from "../../services/local-settings";

export type UserLinkProps = LinkProps & {
  pubkey: string;
  showAt?: boolean;
  tab?: string;
};

export default function UserLink({ pubkey, showAt, tab, ...props }: UserLinkProps) {
  const metadata = useUserMetadata(pubkey);
  const account = useCurrentAccount();
  const { hideUsernames, removeEmojisInUsernames } = useAppSettings();

  const showPubkeyColor = useSubject(localSettings.showPubkeyColor);
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
