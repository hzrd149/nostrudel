import { Link, LinkProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { Bech32Prefix, normalizeToBech32 } from "../helpers/nip-19";
import { getUserDisplayName } from "../helpers/user-metadata";
import { useUserMetadata } from "../hooks/use-user-metadata";

export type UserLinkProps = LinkProps & {
  pubkey: string;
};

export const UserLink = ({ pubkey, ...props }: UserLinkProps) => {
  const metadata = useUserMetadata(pubkey);

  return (
    <Link as={RouterLink} to={`/u/${normalizeToBech32(pubkey, Bech32Prefix.Pubkey)}`} {...props}>
      @{getUserDisplayName(metadata, pubkey)}
    </Link>
  );
};
