import React, { useMemo } from "react";
import { Avatar, AvatarProps } from "@chakra-ui/react";
import { RelayIcon } from "./icons";

export type RelayFaviconProps = Omit<AvatarProps, "src"> & {
  relay: string;
};
export const RelayFavicon = React.memo(({ relay, ...props }: RelayFaviconProps) => {
  const url = useMemo(() => {
    const url = new URL(relay);
    url.protocol = "https:";
    url.pathname = "/favicon.ico";
    return url.toString();
  }, [relay]);

  return <Avatar src={url} icon={<RelayIcon />} overflow="hidden" {...props} />;
});
RelayFavicon.displayName = "RelayFavicon";
