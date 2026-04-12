import { forwardRef } from "react";
import { IconProps } from "@chakra-ui/react";
import { IdentityStatus } from "applesauce-loaders/helpers/dns-identity";

import useDnsIdentity from "../../hooks/use-dns-identity";
import useUserProfile from "../../hooks/use-user-profile";
import { isNamecoinIdentifier } from "../../services/namecoin";
import { ErrorIcon, VerificationFailed, VerificationMissing, VerifiedIcon } from "../icons";
import NamecoinVerifiedIcon from "../icons/namecoin-verified";

const UserDnsIdentityIcon = forwardRef<SVGSVGElement, { pubkey: string } & IconProps>(({ pubkey, ...props }, ref) => {
  const metadata = useUserProfile(pubkey);
  const identity = useDnsIdentity(metadata?.nip05);

  if (!metadata?.nip05) return null;

  const isNmc = isNamecoinIdentifier(metadata.nip05);

  switch (identity?.status) {
    case IdentityStatus.Missing:
      return <VerificationMissing color="red.500" {...props} ref={ref} />;
    case IdentityStatus.Error:
      return <ErrorIcon color="yellow.500" {...props} ref={ref} />;
    case IdentityStatus.Found:
      if (identity.pubkey === pubkey) {
        // Namecoin-verified identities get a distinct teal icon
        return isNmc ? (
          <NamecoinVerifiedIcon color="teal.400" {...props} ref={ref} />
        ) : (
          <VerifiedIcon color="purple.500" {...props} ref={ref} />
        );
      }
      return <VerificationFailed color="red.500" {...props} ref={ref} />;
    default:
      return <VerificationMissing color="blue.500" {...props} ref={ref} />;
  }
});
export default UserDnsIdentityIcon;
