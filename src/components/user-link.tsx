import { Link, LinkProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { getUserDisplayName } from "../helpers/user-metadata";
import { useUserMetadata } from "../hooks/use-user-metadata";

export type UserLinkProps = LinkProps & {
  pubkey: string;
  showAt?: boolean;
  tab?: string;
};

export const UserLink = ({ pubkey, showAt, tab, ...props }: UserLinkProps) => {
  const metadata = useUserMetadata(pubkey);

  return (
    <Link as={RouterLink} to={`/u/${nip19.npubEncode(pubkey)}` + (tab ? "/" + tab : "")} whiteSpace="nowrap" {...props}>
      {showAt && "@"}
      {getUserDisplayName(metadata, pubkey)}
    </Link>
  );
};
