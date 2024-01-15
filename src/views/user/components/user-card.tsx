import { Flex, FlexProps } from "@chakra-ui/react";

import { UserDnsIdentityIcon } from "../../../components/user-dns-identity-icon";
import { UserFollowButton } from "../../../components/user-follow-button";
import UserLink from "../../../components/user-link";
import UserAvatarLink from "../../../components/user-avatar-link";

export type UserCardProps = { pubkey: string; relay?: string } & Omit<FlexProps, "children">;

export const UserCard = ({ pubkey, relay, ...props }: UserCardProps) => {
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
      <UserAvatarLink pubkey={pubkey} />
      <Flex direction="column" flex={1} overflow="hidden">
        <UserLink pubkey={pubkey} fontWeight="bold" />
        <UserDnsIdentityIcon pubkey={pubkey} />
      </Flex>
      <UserFollowButton pubkey={pubkey} size="sm" variant="outline" flexShrink={0} />
    </Flex>
  );
};
