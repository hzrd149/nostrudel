import React, { useMemo } from "react";
import { Avatar, AvatarProps } from "@chakra-ui/react";
import { useUserMetadata } from "../hooks/use-user-metadata";
import { useAsync } from "react-use";
import { getIdenticon } from "../services/identicon";
import { safeUrl } from "../helpers/parse";
import appSettings from "../services/app-settings";
import useSubject from "../hooks/use-subject";

export const UserIdenticon = React.memo(({ pubkey }: { pubkey: string }) => {
  const { value: identicon } = useAsync(() => getIdenticon(pubkey), [pubkey]);

  return identicon ? <img src={`data:image/svg+xml;base64,${identicon}`} width="100%" /> : null;
});

export type UserAvatarProps = Omit<AvatarProps, "src"> & {
  pubkey: string;
  noProxy?: boolean;
};
export const UserAvatar = React.memo(({ pubkey, noProxy, ...props }: UserAvatarProps) => {
  const { imageProxy, proxyUserMedia } = useSubject(appSettings);
  const metadata = useUserMetadata(pubkey);
  const picture = useMemo(() => {
    if (metadata?.picture) {
      const src = safeUrl(metadata?.picture);
      if (!noProxy) {
        if (imageProxy && src) {
          return new URL(`/96/${src}`, imageProxy).toString();
        } else if (proxyUserMedia) {
          const last4 = String(pubkey).slice(pubkey.length - 4, pubkey.length);
          return `https://media.nostr.band/thumbs/${last4}/${pubkey}-picture-64`;
        }
      }
      return src;
    }
  }, [metadata?.picture, imageProxy]);

  return <Avatar src={picture} icon={<UserIdenticon pubkey={pubkey} />} overflow="hidden" {...props} />;
});
UserAvatar.displayName = "UserAvatar";
