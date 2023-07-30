import { Box, Flex, FlexProps, Heading, Input, Link } from "@chakra-ui/react";
import { Link as ReactRouterLink } from "react-router-dom";

import { useUserMetadata } from "../../../hooks/use-user-metadata";
import { getUserDisplayName } from "../../../helpers/user-metadata";
import { UserAvatar } from "../../../components/user-avatar";
import { Bech32Prefix, normalizeToBech32 } from "../../../helpers/nip19";
import { UserDnsIdentityIcon } from "../../../components/user-dns-identity-icon";
import { UserFollowButton } from "../../../components/user-follow-button";

export type UserCardProps = { pubkey: string; relay?: string } & Omit<FlexProps, "children">;

export const UserCard = ({ pubkey, relay, ...props }: UserCardProps) => {
  const metadata = useUserMetadata(pubkey, relay ? [relay] : []);

  return (
    <Flex
      borderWidth="1px"
      borderRadius="lg"
      pl="3"
      pr="3"
      pt="2"
      pb="2"
      overflow="hidden"
      gap="4"
      alignItems="center"
      {...props}
    >
      <UserAvatar pubkey={pubkey} />
      <Flex direction="column" flex={1} overflow="hidden">
        <Link as={ReactRouterLink} to={`/u/${normalizeToBech32(pubkey, Bech32Prefix.Pubkey)}`}>
          <Heading size="sm" whiteSpace="nowrap" isTruncated>
            {getUserDisplayName(metadata, pubkey)}
          </Heading>
        </Link>
        <UserDnsIdentityIcon pubkey={pubkey} />
      </Flex>
      <UserFollowButton pubkey={pubkey} size="sm" variant="outline" flexShrink={0} />
    </Flex>
  );
};
