import { Link, LinkProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { Bech32Prefix, normalizeToBech32 } from "../helpers/nip19";
import { getUserDisplayName } from "../helpers/user-metadata";
import { useUserMetadata } from "../hooks/use-user-metadata";

export type UserLinkProps = LinkProps & {
  pubkey: string;
  showAt?: boolean;
};

export const UserLink = ({ pubkey, showAt, ...props }: UserLinkProps) => {
  const metadata = useUserMetadata(pubkey);
  const npub = normalizeToBech32(pubkey, Bech32Prefix.Pubkey);

  return (
    <Link as={RouterLink} to={`/u/${npub}`} whiteSpace="nowrap" {...props}>
      {showAt && "@"}
      {getUserDisplayName(metadata, pubkey)}
    </Link>
  );
};
