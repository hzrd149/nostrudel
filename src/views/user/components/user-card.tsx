import { Box, Code, Flex, Heading, Input, Link, Spacer, Text } from "@chakra-ui/react";
import { Link as ReactRouterLink } from "react-router-dom";

import { useUserMetadata } from "../../../hooks/use-user-metadata";
import { getUserDisplayName } from "../../../helpers/user-metadata";
import { UserAvatar } from "../../../components/user-avatar";
import { Bech32Prefix, normalizeToBech32 } from "../../../helpers/nip19";
import { UserDnsIdentityIcon } from "../../../components/user-dns-identity-icon";
import { UserFollowButton } from "../../../components/user-follow-button";
import { useIsMobile } from "../../../hooks/use-is-mobile";

export const UserCard = ({ pubkey, relay }: { pubkey: string; relay?: string }) => {
  const isMobile = useIsMobile();
  const metadata = useUserMetadata(pubkey, relay ? [relay] : []);

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      pl="3"
      pr="3"
      pt="2"
      pb="2"
      overflow="hidden"
      gap="4"
      display="flex"
      alignItems="center"
    >
      <UserAvatar pubkey={pubkey} />
      <Flex direction="column" flex={1} overflowY="hidden" overflowX="auto">
        <Link as={ReactRouterLink} to={`/u/${normalizeToBech32(pubkey, Bech32Prefix.Pubkey)}`}>
          <Heading size="sm" whiteSpace="nowrap">
            {getUserDisplayName(metadata, pubkey)}
          </Heading>
        </Link>
        <UserDnsIdentityIcon pubkey={pubkey} />
      </Flex>
      {relay && !isMobile && <Input readOnly value={relay} w="xs" />}
      <UserFollowButton pubkey={pubkey} size="sm" variant="outline" flexShrink={0} />
    </Box>
  );
};
