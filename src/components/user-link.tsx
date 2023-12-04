import { Link, LinkProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { getUserDisplayName } from "../helpers/user-metadata";
import { useUserMetadata } from "../hooks/use-user-metadata";
import useAppSettings from "../hooks/use-app-settings";
import useCurrentAccount from "../hooks/use-current-account";

export type UserLinkProps = LinkProps & {
  pubkey: string;
  showAt?: boolean;
  tab?: string;
};

export default function UserLink({ pubkey, showAt, tab, ...props }: UserLinkProps) {
  const metadata = useUserMetadata(pubkey);
  const account = useCurrentAccount();
  const { hideUsernames } = useAppSettings();

  return (
    <Link as={RouterLink} to={`/u/${nip19.npubEncode(pubkey)}` + (tab ? "/" + tab : "")} whiteSpace="nowrap" {...props}>
      {showAt && "@"}
      {hideUsernames && pubkey !== account?.pubkey ? "Anon" : getUserDisplayName(metadata, pubkey)}
    </Link>
  );
}
