import { Avatar, AvatarProps } from "@chakra-ui/react";
import styled from "@emotion/styled";
import { ProfileContent } from "applesauce-core/helpers";
import { useActiveAccount, useObservableEagerState } from "applesauce-react/hooks";
import { ProfilePointer } from "nostr-tools/nip19";
import { forwardRef, memo, useMemo } from "react";
import { useAsync } from "react-use";

import { getIdenticon } from "../../helpers/identicon";
import { buildImageProxyURL } from "../../helpers/image";
import { getDisplayName } from "../../helpers/nostr/profile";
import { safeUrl } from "../../helpers/parse";
import useAppSettings from "../../hooks/use-user-app-settings";
import useUserMuteList from "../../hooks/use-user-mute-list";
import useUserProfile from "../../hooks/use-user-profile";
import UserDnsIdentityIcon from "./user-dns-identity-icon";
import localSettings from "../../services/preferences";

export const UserIdenticon = memo(({ pubkey }: { pubkey: string }) => {
  const { value: identicon } = useAsync(() => getIdenticon(pubkey), [pubkey]);

  return identicon ? (
    <img
      src={`data:image/svg+xml;base64,${identicon}`}
      width="100%"
      style={{ borderRadius: "var(--chakra-radii-lg)" }}
    />
  ) : null;
});

const RESIZE_PROFILE_SIZE = 96;

export type UserAvatarProps = Omit<MetadataAvatarProps, "pubkey" | "metadata"> & {
  pubkey?: string;
  relay?: string;
  user?: ProfilePointer;
};
export const UserAvatar = forwardRef<HTMLDivElement, UserAvatarProps>(
  ({ user, pubkey, relay, noProxy, size, ...props }, ref) => {
    const profile = useUserProfile(user ? user : { pubkey: pubkey!, relays: relay ? [relay] : [] });
    const account = useActiveAccount();
    const muteList = useUserMuteList(account?.pubkey);

    const muted = muteList?.tags.some((t) => t[0] === "p" && t[1] === pubkey);

    return (
      <MetadataAvatar
        pubkey={pubkey}
        metadata={muted ? undefined : profile}
        noProxy={noProxy}
        ref={ref}
        size={size}
        {...props}
      >
        {size !== "xs" && (
          <UserDnsIdentityIcon
            pubkey={user?.pubkey ?? pubkey!}
            position="absolute"
            right={-1}
            bottom={-1}
            bgColor="white"
            borderRadius="50%"
            boxSize="1em"
          />
        )}
      </MetadataAvatar>
    );
  },
);
UserAvatar.displayName = "UserAvatar";

const SquareAvatar = styled(Avatar)`
  img {
    border-radius: var(--chakra-radii-lg);
  }
`;
const SquareAvatarWithBorder = styled(SquareAvatar)`
  img {
    border-width: 0.18rem;
    border-color: inherit;
    border-style: solid;
  }
`;

export type MetadataAvatarProps = Omit<AvatarProps, "src"> & {
  metadata?: ProfileContent;
  pubkey?: string;
  noProxy?: boolean;
  square?: boolean;
};
export const MetadataAvatar = forwardRef<HTMLDivElement, MetadataAvatarProps>(
  ({ pubkey, metadata, noProxy, children, square = true, ...props }, ref) => {
    const { imageProxy, showPubkeyColor } = useAppSettings();
    const hideUsernames = useObservableEagerState(localSettings.hideUsernames);
    const account = useActiveAccount();
    const picture = useMemo(() => {
      if (hideUsernames && pubkey && pubkey !== account?.pubkey) return undefined;
      if (metadata?.picture) {
        const src = safeUrl(metadata?.picture);
        if (src && !noProxy) {
          const proxyURL = buildImageProxyURL(src, RESIZE_PROFILE_SIZE);
          if (proxyURL) return proxyURL;
        }
        return src;
      }
    }, [metadata?.picture, imageProxy, hideUsernames, account]);

    const color = pubkey ? "#" + pubkey.slice(0, 6) : undefined;

    const showColor = showPubkeyColor === "avatar" && color !== undefined && props.size !== "xs";

    const AvatarComponent = square ? (showColor ? SquareAvatarWithBorder : SquareAvatar) : Avatar;

    return (
      <AvatarComponent
        ref={ref}
        src={picture}
        icon={pubkey ? <UserIdenticon pubkey={pubkey} /> : undefined}
        // overflow="hidden"
        title={getDisplayName(metadata, pubkey ?? "")}
        borderColor={showColor ? color : undefined}
        borderStyle="none"
        {...props}
      >
        {children}
      </AvatarComponent>
    );
  },
);

export default memo(UserAvatar);
