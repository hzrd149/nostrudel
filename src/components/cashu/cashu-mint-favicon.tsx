import { useMemo } from "react";
import { useAsync } from "react-use";
import { Avatar, AvatarProps } from "@chakra-ui/react";

import { MediaServerIcon } from "../icons";
import { getCashuMint } from "../../services/cashu-mints";

export default function CashuMintFavicon({ mint, ...props }: { mint: string } & Omit<AvatarProps, "src">) {
  const { value: cashuMint } = useAsync(() => getCashuMint(mint), [mint]);
  const { value: info } = useAsync(async () => cashuMint?.getInfo(), [cashuMint]);

  const url = useMemo(() => {
    const url = new URL(mint);
    url.protocol = "https:";
    url.pathname = "/favicon.ico";
    return url.toString();
  }, [mint]);

  return <Avatar src={url} icon={<MediaServerIcon />} overflow="hidden" {...props} />;
}
