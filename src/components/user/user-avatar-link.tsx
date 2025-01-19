import { forwardRef, memo } from "react";
import { Link } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { UserAvatar, UserAvatarProps } from "./user-avatar";

export const UserAvatarLink = forwardRef<HTMLAnchorElement | null, UserAvatarProps>(({ pubkey, ...props }, ref) => (
  <Link to={`/u/${nip19.npubEncode(pubkey)}`} ref={ref}>
    <UserAvatar pubkey={pubkey} {...props} />
  </Link>
));

export default memo(UserAvatarLink);
