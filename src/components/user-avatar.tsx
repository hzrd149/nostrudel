import React, { useMemo } from "react";
import { Avatar } from "@chakra-ui/react";
import Identicon from "identicon.js";
import { useUserMetadata } from "../hooks/use-user-metadata";

const cache: Record<string, Identicon> = {};
function getIdenticon(pubkey: string) {
  if (!cache[pubkey]) {
    cache[pubkey] = new Identicon(pubkey, { format: "svg" });
  }
  return cache[pubkey];
}

export type UserAvatarProps = {
  pubkey: string;
};
export const UserAvatar = React.memo(({ pubkey }: UserAvatarProps) => {
  const metadata = useUserMetadata(pubkey);

  const url = useMemo(() => {
    return (
      metadata?.picture ??
      `data:image/svg+xml;base64,${getIdenticon(pubkey).toString()}`
    );
  }, [metadata]);

  return <Avatar src={url} />;
});
