import { forwardRef, memo } from "react";
import { Link } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { UserAvatar, UserAvatarProps } from "./user-avatar";
import { npubEncode } from "nostr-tools/nip19";

export const UserAvatarLink = forwardRef<HTMLAnchorElement | null, UserAvatarProps>(
  ({ pubkey, user, ...props }, ref) => (
    <Link to={`/u/${npubEncode(user?.pubkey ?? pubkey!)}`} ref={ref}>
      <UserAvatar pubkey={pubkey} {...props} />
    </Link>
  ),
);

export default memo(UserAvatarLink);
