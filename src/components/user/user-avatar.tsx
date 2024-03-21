import { forwardRef, memo, useMemo } from "react";
import { Avatar, AvatarBadge, AvatarProps } from "@chakra-ui/react";
import { useAsync } from "react-use";

import useUserMetadata from "../../hooks/use-user-metadata";
import { getIdenticon } from "../../helpers/identicon";
import { safeUrl } from "../../helpers/parse";
import { Kind0ParsedContent, getUserDisplayName } from "../../helpers/nostr/user-metadata";
import useAppSettings from "../../hooks/use-app-settings";
import useCurrentAccount from "../../hooks/use-current-account";
import { buildImageProxyURL } from "../../helpers/image";
import UserDnsIdentityIcon, { useDnsIdentityColor } from "./user-dns-identity-icon";
import styled from "@emotion/styled";

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
  pubkey: string;
  relay?: string;
};
export const UserAvatar = forwardRef<HTMLDivElement, UserAvatarProps>(
  ({ pubkey, noProxy, relay, size, ...props }, ref) => {
    const metadata = useUserMetadata(pubkey, relay ? [relay] : undefined);
    const color = useDnsIdentityColor(pubkey);

    return (
      <MetadataAvatar
        pubkey={pubkey}
        metadata={metadata}
        noProxy={noProxy}
        ref={ref}
        borderColor={color}
        borderStyle="none"
        size={size}
        {...props}
      >
        {size !== "xs" && (
          <UserDnsIdentityIcon
            pubkey={pubkey}
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

const StyledAvatar = styled(Avatar)`
  img {
    border-radius: var(--chakra-radii-lg);
    border-width: 0.18rem;
    border-color: inherit;
    border-style: solid;
  }
`;
export type MetadataAvatarProps = Omit<AvatarProps, "src"> & {
  metadata?: Kind0ParsedContent;
  pubkey?: string;
  noProxy?: boolean;
};
export const MetadataAvatar = forwardRef<HTMLDivElement, MetadataAvatarProps>(
  ({ pubkey, metadata, noProxy, children, ...props }, ref) => {
    const { imageProxy, proxyUserMedia, hideUsernames } = useAppSettings();
    const account = useCurrentAccount();
    const picture = useMemo(() => {
      if (hideUsernames && pubkey && pubkey !== account?.pubkey) return undefined;
      if (metadata?.picture) {
        const src = safeUrl(metadata?.picture);
        if (src) {
          const proxyURL = buildImageProxyURL(src, RESIZE_PROFILE_SIZE);
          if (proxyURL) return proxyURL;
        } else if (!noProxy && proxyUserMedia && pubkey) {
          const last4 = String(pubkey).slice(pubkey.length - 4, pubkey.length);
          return `https://media.nostr.band/thumbs/${last4}/${pubkey}-picture-64`;
        }
        return src;
      }
    }, [metadata?.picture, imageProxy, proxyUserMedia, hideUsernames, account]);

    return (
      <StyledAvatar
        src={picture}
        icon={pubkey ? <UserIdenticon pubkey={pubkey} /> : undefined}
        // overflow="hidden"
        title={getUserDisplayName(metadata, pubkey ?? "")}
        ref={ref}
        {...props}
      >
        {children}
      </StyledAvatar>
    );
  },
);
UserAvatar.displayName = "UserAvatar";

export default memo(UserAvatar);
