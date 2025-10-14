import { forwardRef, memo } from "react";
import { Link } from "react-router-dom";

import { npubEncode } from "nostr-tools/nip19";
import { UserAvatar, UserAvatarProps } from "./user-avatar";

export const UserAvatarLink = forwardRef<HTMLAnchorElement | null, UserAvatarProps>(
  ({ pubkey, user, ...props }, ref) => (
    <Link to={`/u/${npubEncode(user?.pubkey ?? pubkey!)}`} ref={ref}>
      <UserAvatar pubkey={pubkey} user={user} {...props} />
    </Link>
  ),
);

export default memo(UserAvatarLink);
