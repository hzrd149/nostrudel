import { forwardRef, memo } from "react";
import { Link } from "react-router-dom";

import { npubEncode } from "../../helpers/nip19";
import { UserAvatar, UserAvatarProps } from "./user-avatar";

export const UserAvatarLink = forwardRef<HTMLAnchorElement, UserAvatarProps>(({ pubkey, ...props }, ref) => (
  <Link to={`/u/${npubEncode(pubkey) || pubkey}`} ref={ref}>
    <UserAvatar pubkey={pubkey} {...props} />
  </Link>
));

export default memo(UserAvatarLink);
