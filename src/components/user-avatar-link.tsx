import React from "react";
import { Link } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { UserAvatar, UserAvatarProps } from "./user-avatar";

export const UserAvatarLink = React.memo(({ pubkey, ...props }: UserAvatarProps) => (
  <Link to={`/u/${nip19.npubEncode(pubkey)}`}>
    <UserAvatar pubkey={pubkey} {...props} />
  </Link>
));
