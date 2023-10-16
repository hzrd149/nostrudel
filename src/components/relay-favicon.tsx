import React, { useMemo } from "react";
import { Avatar, AvatarProps } from "@chakra-ui/react";

import { RelayIcon } from "./icons";
import { useRelayInfo } from "../hooks/use-relay-info";

export type RelayFaviconProps = Omit<AvatarProps, "src"> & {
  relay: string;
};
export const RelayFavicon = React.memo(({ relay, ...props }: RelayFaviconProps) => {
  const { info } = useRelayInfo(relay);

  const url = useMemo(() => {
    if (info?.icon) return info.icon;

    const url = new URL(relay);
    url.protocol = "https:";
    url.pathname = "/favicon.ico";
    return url.toString();
  }, [relay, info]);

  return <Avatar src={url} icon={<RelayIcon />} overflow="hidden" {...props} />;
});
RelayFavicon.displayName = "RelayFavicon";
