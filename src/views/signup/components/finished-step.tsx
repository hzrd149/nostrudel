import { Button, Card, Flex, Heading, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { ProfileContent } from "applesauce-core/helpers";
import { useAsync } from "react-use";

import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import { containerProps } from "./common";
import { UserFollowButton } from "../../../components/user/user-follow-button";
import UserDnsIdentity from "../../../components/user/user-dns-identity";

type TrendingApi = {
  profiles: {
    pubkey: string;
    relays: string[];
    profile: {
      content: string;
      id: string;
      kind: 0;
      created_at: number;
    };
  }[];
};

function About({ profile }: { profile: { content: string } }) {
  const { value: metadata } = useAsync(async () => JSON.parse(profile.content) as ProfileContent, [profile.content]);
  return metadata ? <Text>{metadata.about}</Text> : null;
}

export default function FinishedStep() {
  const { value: trending } = useAsync(async () => {
    return await fetch("https://api.nostr.band/v0/trending/profiles").then((res) => res.json() as Promise<TrendingApi>);
  });

  return (
    <Flex gap="4" {...containerProps} maxW="6in">
      <Heading>Follow a few others</Heading>
      <Flex overflowX="hidden" overflowY="scroll" minH="4in" maxH="6in" direction="column" gap="2" w="full">
        {trending?.profiles.map(({ pubkey, profile }) => (
          <Card p="4" key={pubkey} variant="outline" gap="2">
            <Flex direction="row" alignItems="center" gap="4">
              <UserAvatarLink pubkey={pubkey} />
              <Flex direction="column" overflow="hidden">
                <UserLink pubkey={pubkey} fontWeight="bold" fontSize="lg" isTruncated />
                <UserDnsIdentity pubkey={pubkey} />
              </Flex>
              <UserFollowButton pubkey={pubkey} flexShrink={0} ml="auto" />
            </Flex>
            {profile && <About profile={profile} />}
          </Card>
        ))}
      </Flex>
      <Button as={RouterLink} to="/" colorScheme="primary" maxW="sm" w="full">
        Start exploring nostr
      </Button>
    </Flex>
  );
}
