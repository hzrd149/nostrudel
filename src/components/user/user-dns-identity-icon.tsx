import { forwardRef } from "react";
import { IconProps } from "@chakra-ui/react";
import { IdentityStatus } from "applesauce-loaders/helpers/dns-identity";

import useDnsIdentity from "../../hooks/use-dns-identity";
import useUserProfile from "../../hooks/use-user-profile";
import { ErrorIcon, VerificationFailed, VerificationMissing, VerifiedIcon } from "../icons";

const UserDnsIdentityIcon = forwardRef<SVGSVGElement, { pubkey: string } & IconProps>(({ pubkey, ...props }, ref) => {
  const metadata = useUserProfile(pubkey);
  const identity = useDnsIdentity(metadata?.nip05);

  if (!metadata?.nip05) return null;

  switch (identity?.status) {
    case IdentityStatus.Missing:
      return <VerificationMissing color="red.500" {...props} ref={ref} />;
    case IdentityStatus.Error:
      return <ErrorIcon color="yellow.500" {...props} ref={ref} />;
    case IdentityStatus.Found:
      return identity.pubkey === pubkey ? (
        <VerifiedIcon color="purple.500" {...props} ref={ref} />
      ) : (
        <VerificationFailed color="red.500" {...props} ref={ref} />
      );
    default:
      return <VerificationMissing color="blue.500" {...props} ref={ref} />;
  }
});
export default UserDnsIdentityIcon;
