import { Spinner, Tooltip } from "@chakra-ui/react";
import { useDnsIdentity } from "../hooks/use-dns-identity";
import { useUserMetadata } from "../hooks/use-user-metadata";
import { VerificationFailed, VerifiedIcon } from "./icons";

export const UserDnsIdentityIcon = ({ pubkey }: { pubkey: string }) => {
  const metadata = useUserMetadata(pubkey);
  const { identity, loading, error } = useDnsIdentity(metadata?.nip05);

  if (!metadata?.nip05) {
    return null;
  }

  let title = metadata.nip05;

  const renderIcon = () => {
    if (loading) {
      return <Spinner size="xs" ml="1" />;
    } else if (error) {
      return <VerificationFailed color="yellow.500" />;
    } else {
      const isValid = !!identity && pubkey === identity.pubkey;
      return isValid ? <VerifiedIcon color="purple.500" /> : <VerificationFailed color="red.500" />;
    }
  };

  return <Tooltip label={title}>{renderIcon()}</Tooltip>;
};
