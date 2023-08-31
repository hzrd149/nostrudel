import { Link, LinkProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { getUserDisplayName } from "../helpers/user-metadata";
import { useUserMetadata } from "../hooks/use-user-metadata";

export type UserLinkProps = LinkProps & {
  pubkey: string;
  showAt?: boolean;
};

export const UserLink = ({ pubkey, showAt, ...props }: UserLinkProps) => {
  const metadata = useUserMetadata(pubkey);

  return (
    <Link as={RouterLink} to={`/u/${nip19.npubEncode(pubkey)}`} whiteSpace="nowrap" {...props}>
      {showAt && "@"}
      {getUserDisplayName(metadata, pubkey)}
    </Link>
  );
};
