import { Text, Tooltip } from "@chakra-ui/react";

import { useDnsIdentity } from "../../hooks/use-dns-identity";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { VerificationFailed, VerificationMissing, VerifiedIcon } from "../icons";

export function UserDnsIdentityIcon({ pubkey, onlyIcon }: { pubkey: string; onlyIcon?: boolean }) {
  const metadata = useUserMetadata(pubkey);
  const identity = useDnsIdentity(metadata?.nip05);

  if (!metadata?.nip05) {
    return null;
  }

  const renderIcon = () => {
    if (identity === undefined) {
      return <VerificationFailed color="yellow.500" />;
    } else if (identity === null) {
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
    <Text as="span" whiteSpace="nowrap">
      {metadata.nip05.startsWith("_@") ? metadata.nip05.substr(2) : metadata.nip05} {renderIcon()}
    </Text>
  );
}

export default UserDnsIdentityIcon;
