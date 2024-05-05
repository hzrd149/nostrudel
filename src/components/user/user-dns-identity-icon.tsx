import { forwardRef } from "react";
import { IconProps } from "@chakra-ui/react";

import useDnsIdentity from "../../hooks/use-dns-identity";
import useUserMetadata from "../../hooks/use-user-metadata";
import { VerificationFailed, VerificationMissing, VerifiedIcon } from "../icons";

const UserDnsIdentityIcon = forwardRef<SVGSVGElement, { pubkey: string } & IconProps>(({ pubkey, ...props }, ref) => {
  const metadata = useUserMetadata(pubkey);
  const identity = useDnsIdentity(metadata?.nip05);

  if (!metadata?.nip05) return null;

  if (identity === undefined) {
    return <VerificationFailed color="yellow.500" {...props} ref={ref} />;
  } else if (identity.exists === false || identity.pubkey === undefined) {
    return <VerificationMissing color="red.500" {...props} ref={ref} />;
  } else if (pubkey === identity.pubkey) {
    return <VerifiedIcon color="purple.500" {...props} ref={ref} />;
  } else {
    return <VerificationFailed color="red.500" {...props} ref={ref} />;
  }
});
export default UserDnsIdentityIcon;
