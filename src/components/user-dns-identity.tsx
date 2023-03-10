import { Spinner, Tooltip } from "@chakra-ui/react";
import { useDnsIdentity } from "../hooks/use-dns-identity";
import { useUserMetadata } from "../hooks/use-user-metadata";
import { VerificationFailed, VerificationMissing, VerifiedIcon } from "./icons";

export const UserDnsIdentityIcon = ({ pubkey, onlyIcon }: { pubkey: string; onlyIcon?: boolean }) => {
  const metadata = useUserMetadata(pubkey);
  const { identity, loading, error } = useDnsIdentity(metadata?.nip05);

  if (!metadata?.nip05) {
    return null;
  }

  const renderIcon = () => {
    if (loading) {
      return <Spinner size="xs" ml="1" />;
    } else if (error) {
      return <VerificationFailed color="yellow.500" />;
    } else if (!identity) {
      return <VerificationMissing color="red.500" />;
    } else if (pubkey === identity.pubkey) {
      return <VerifiedIcon color="purple.500" />;
    } else {
      return <VerificationFailed color="red.500" />;
    }
  };

  if (onlyIcon) {
    return <Tooltip label={metadata.nip05}>{renderIcon()}</Tooltip>;
  }
  return (
    <span>
      {metadata.nip05} {renderIcon()}
    </span>
  );
};
