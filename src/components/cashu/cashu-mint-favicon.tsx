import { Avatar, AvatarProps } from "@chakra-ui/react";

import { MediaServerIcon } from "../icons";
import { cashuMintInfo } from "../../services/cashu-mints";
import { useObservable } from "applesauce-react/hooks";

export default function CashuMintFavicon({ mint, ...props }: { mint: string } & Omit<AvatarProps, "src">) {
  const info = useObservable(cashuMintInfo(mint));

  return <Avatar src={info && Reflect.get(info, "icon_url")} icon={<MediaServerIcon />} overflow="hidden" {...props} />;
}
