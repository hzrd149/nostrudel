import React from "react";
import { Avatar, AvatarProps } from "@chakra-ui/react";
import { useUserMetadata } from "../hooks/use-user-metadata";
import { useAsync } from "react-use";
import { getIdenticon } from "../services/identicon";
import { safeUrl } from "../helpers/parse";

export type UserAvatarProps = Omit<AvatarProps, "src"> & {
  pubkey: string;
};
export const UserAvatar = React.memo(({ pubkey, ...props }: UserAvatarProps) => {
  const metadata = useUserMetadata(pubkey);
  const { value: identicon } = useAsync(() => getIdenticon(pubkey), [pubkey]);

  return (
    <Avatar
      src={metadata?.picture && safeUrl(metadata?.picture)}
      icon={identicon ? <img src={`data:image/svg+xml;base64,${identicon}`} width="100%" /> : undefined}
      overflow="hidden"
      {...props}
    />
  );
});
UserAvatar.displayName = "UserAvatar";
