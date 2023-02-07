import React from "react";
import { Avatar, AvatarProps } from "@chakra-ui/react";
import { useUserMetadata } from "../hooks/use-user-metadata";
import { useAsync } from "react-use";
import { getIdenticon } from "../services/identicon";
import { safeUrl } from "../helpers/parse";

export const UserIdenticon = React.memo(({ pubkey }: { pubkey: string }) => {
  const { value: identicon } = useAsync(() => getIdenticon(pubkey), [pubkey]);

  return identicon ? <img src={`data:image/svg+xml;base64,${identicon}`} width="100%" /> : null;
});

export type UserAvatarProps = Omit<AvatarProps, "src"> & {
  pubkey: string;
};
export const UserAvatar = React.memo(({ pubkey, ...props }: UserAvatarProps) => {
  const metadata = useUserMetadata(pubkey);

  return (
    <Avatar
      src={metadata?.picture && safeUrl(metadata?.picture)}
      icon={<UserIdenticon pubkey={pubkey} />}
      overflow="hidden"
      {...props}
    />
  );
});
UserAvatar.displayName = "UserAvatar";
