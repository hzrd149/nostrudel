import { Link, LinkProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { npubEncode } from "../../helpers/nip19";
import { getUserDisplayName } from "../../helpers/nostr/user-metadata";
import useAppSettings from "../../hooks/use-app-settings";
import useCurrentAccount from "../../hooks/use-current-account";
import useUserMetadata from "../../hooks/use-user-metadata";

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
    <Link as={RouterLink} to={`/u/${npubEncode(pubkey)}` + (tab ? "/" + tab : "")} whiteSpace="nowrap" {...props}>
      {showAt && "@"}
      {hideUsernames && pubkey !== account?.pubkey ? "Anon" : getUserDisplayName(metadata, pubkey)}
    </Link>
  );
}
