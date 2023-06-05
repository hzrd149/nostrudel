import { Box, Flex, Heading, Link, Text } from "@chakra-ui/react";
import { Link as ReactRouterLink } from "react-router-dom";

import { useUserMetadata } from "../../../hooks/use-user-metadata";
import { getUserDisplayName } from "../../../helpers/user-metadata";
import { UserAvatar } from "../../../components/user-avatar";
import { Bech32Prefix, normalizeToBech32 } from "../../../helpers/nip19";
import { UserDnsIdentityIcon } from "../../../components/user-dns-identity-icon";

export const UserCard = ({ pubkey, relay }: { pubkey: string; relay?: string }) => {
  const metadata = useUserMetadata(pubkey, relay ? [relay] : []);

  return (
    <Box borderWidth="1px" borderRadius="lg" pl="3" pr="3" pt="2" pb="2" overflow="hidden">
      <Flex gap="4" alignItems="center">
        <UserAvatar pubkey={pubkey} />
        <Box>
          <Link as={ReactRouterLink} to={`/u/${normalizeToBech32(pubkey, Bech32Prefix.Pubkey)}`}>
            <Heading size="sm">{getUserDisplayName(metadata, pubkey)}</Heading>
          </Link>
          <UserDnsIdentityIcon pubkey={pubkey} />
          {relay && <Text>{relay}</Text>}
        </Box>
      </Flex>
    </Box>
  );
};
