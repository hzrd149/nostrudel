import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { nip19 } from "nostr-tools";
import { Box, BoxProps } from "@chakra-ui/react";
import { getProfilePicture } from "applesauce-core/helpers";

import { AddressPointer } from "nostr-tools/nip19";
import useDVMMetadata from "../../../../hooks/use-dvm-metadata";
import useUserProfile from "../../../../hooks/use-user-profile";

type DVMAvatarProps = {
  pointer: AddressPointer;
} & Omit<BoxProps, "children">;

export const DVMAvatar = forwardRef<HTMLDivElement, DVMAvatarProps>(({ pointer, ...props }, ref) => {
  const metadata = useDVMMetadata(pointer);
  const profile = useUserProfile(pointer.pubkey);
  const image = getProfilePicture(metadata) || getProfilePicture(profile) || "";

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
