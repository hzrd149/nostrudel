import React from "react";
import { Link } from "react-router-dom";
import { Bech32Prefix, normalizeToBech32 } from "../helpers/nip-19";
import { UserAvatar, UserAvatarProps } from "./user-avatar";

export const UserAvatarLink = React.memo(({ pubkey, ...props }: UserAvatarProps) => (
  <Link to={`/u/${normalizeToBech32(pubkey, Bech32Prefix.Pubkey)}`}>
    <UserAvatar pubkey={pubkey} {...props} />
  </Link>
));
