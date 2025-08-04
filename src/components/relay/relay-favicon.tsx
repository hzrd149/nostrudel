import React, { useMemo } from "react";
import { Avatar, AvatarProps } from "@chakra-ui/react";

import { RelayIcon } from "../icons";
import { useRelayInfo } from "../../hooks/use-relay-info";
import useRelayConnectionState from "../../hooks/use-relay-connection-state";
import { getConnectionStateColor } from "../../helpers/relay";

export type RelayFaviconProps = Omit<AvatarProps, "src"> & {
  relay: string;
};
const RelayFavicon = React.memo(({ relay, showStatus, ...props }: RelayFaviconProps & { showStatus?: boolean }) => {
  const { info } = useRelayInfo(relay);
  const state = useRelayConnectionState(relay);
  const color = getConnectionStateColor(state);

  const url = useMemo(() => {
    if (info?.icon) return info.icon;

    const url = new URL(relay);
    url.protocol = "https:";
    url.pathname = "/favicon.ico";
    return url.toString();
  }, [relay, info]);

  return (
    <Avatar
      src={url}
      icon={<RelayIcon />}
      overflow="hidden"
      colorScheme={color}
      outline={showStatus ? "2px solid" : "none"}
      outlineColor={showStatus ? color + ".500" : undefined}
      aria-label={`Relay: ${relay}`}
      title={`Relay: ${relay}`}
      {...props}
    />
  );
});
RelayFavicon.displayName = "RelayFavicon";

export default RelayFavicon;
