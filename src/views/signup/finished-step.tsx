import { Box, Button, Card, Flex, Heading, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useAsync } from "react-use";

import UserAvatarLink from "../../components/user/user-avatar-link";
import UserLink from "../../components/user/user-link";
import { containerProps } from "./common";
import { UserFollowButton } from "../../components/user/user-follow-button";
import { Kind0ParsedContent } from "../../helpers/nostr/user-metadata";
import UserDnsIdentity from "../../components/user/user-dns-identity";

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
  const { value: metadata, error } = useAsync(
    async () => JSON.parse(profile.content) as Kind0ParsedContent,
    [profile.content],
  );
  return metadata ? <Text>{metadata.about}</Text> : null;
}

export default function FinishedStep() {
  const { value: trending } = useAsync(async () => {
    return await fetch("https://api.nostr.band/v0/trending/profiles").then((res) => res.json() as Promise<TrendingApi>);
  });

  return (
    <Flex gap="4" {...containerProps} maxW="6in">
      <Button as={RouterLink} to="/" colorScheme="primary" maxW="sm" w="full">
        Start exploring nostr
      </Button>
    </Flex>
  );
}
