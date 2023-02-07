import React from "react";
import { Tooltip } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { Bech32Prefix, normalizeToBech32 } from "../helpers/nip-19";
import { useUserMetadata } from "../hooks/use-user-metadata";
import { UserAvatar, UserAvatarProps } from "./user-avatar";
import { getUserDisplayName } from "../helpers/user-metadata";

export const UserAvatarLink = React.memo(
  ({ pubkey, ...props }: UserAvatarProps) => {
    const { metadata } = useUserMetadata(pubkey);
    const label = metadata
      ? getUserDisplayName(metadata, pubkey)
      : "Loading...";

    return (
      <Tooltip label={label}>
        <Link to={`/u/${normalizeToBech32(pubkey, Bech32Prefix.Pubkey)}`}>
          <UserAvatar pubkey={pubkey} {...props} />
        </Link>
      </Tooltip>
    );
  }
);
