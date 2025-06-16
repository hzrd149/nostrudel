import { Avatar, AvatarProps } from "@chakra-ui/react";
import { useObservableState } from "applesauce-react/hooks";

import { cashuMintInfo } from "../../services/cashu-mints";
import { MediaServerIcon } from "../icons";

export default function CashuMintFavicon({ mint, ...props }: { mint: string } & Omit<AvatarProps, "src">) {
  const info = useObservableState(cashuMintInfo(mint));

  return <Avatar src={info && Reflect.get(info, "icon_url")} icon={<MediaServerIcon />} overflow="hidden" {...props} />;
}
