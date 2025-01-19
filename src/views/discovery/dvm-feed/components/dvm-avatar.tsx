import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { nip19 } from "nostr-tools";
import { Box, BoxProps } from "@chakra-ui/react";

import useUserProfile from "../../../../hooks/use-user-profile";

import { AddressPointer } from "nostr-tools/nip19";
import useDVMMetadata from "../../../../hooks/use-dvm-metadata";

type DVMAvatarProps = {
  pointer: AddressPointer;
  noProxy?: boolean;
} & Omit<BoxProps, "children">;

export const DVMAvatar = forwardRef<HTMLDivElement, DVMAvatarProps>(({ pointer, noProxy, ...props }, ref) => {
  const dvmMetadata = useDVMMetadata(pointer);
  const userMetadata = useUserProfile(pointer.pubkey);
  const image = dvmMetadata?.image || userMetadata?.picture || "";

  return (
    <Box
      aspectRatio={1}
      backgroundImage={image}
      backgroundRepeat="no-repeat"
      backgroundPosition="center"
      backgroundSize="cover"
      borderRadius="lg"
      ref={ref}
      {...props}
    />
  );
});

export const DVMAvatarLink = forwardRef<HTMLAnchorElement, DVMAvatarProps>(({ pointer, ...props }, ref) => {
  return (
    <Link to={`/u/${nip19.npubEncode(pointer.pubkey)}`} ref={ref}>
      <DVMAvatar pointer={pointer} {...props} />
    </Link>
  );
});

export default DVMAvatar;
