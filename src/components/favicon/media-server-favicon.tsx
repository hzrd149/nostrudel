import { useMemo } from "react";
import { Avatar, AvatarProps } from "@chakra-ui/react";

import { MediaServerIcon } from "../icons";

export type RelayFaviconProps = Omit<AvatarProps, "src"> & {
  server: string | URL;
};
export default function MediaServerFavicon({ server, ...props }: RelayFaviconProps) {
  const url = useMemo(() => {
    const url = new URL(server);
    url.protocol = "https:";
    url.pathname = "/favicon.ico";
    return url.toString();
  }, [server]);

  return <Avatar src={url} icon={<MediaServerIcon />} overflow="hidden" {...props} />;
}
