import { Link as RouterLink } from "react-router-dom";
import { Card, CardFooter, CardHeader, CardProps, Heading, LinkBox, LinkOverlay, Text } from "@chakra-ui/react";
import { nip19 } from "nostr-tools";

import { UserAvatarLink } from "../../../components/user-avatar-link";
import { UserLink } from "../../../components/user-link";
import { NostrEvent } from "../../../types/nostr-event";
import { getCommunityImage, getCommunityName } from "../../../helpers/nostr/communities";

export default function EmbeddedCommunity({
  community,
  ...props
}: Omit<CardProps, "children"> & { community: NostrEvent }) {
  const name = getCommunityName(community);

  return (
    <Card
      as={LinkBox}
      variant="outline"
      gap="2"
      overflow="hidden"
      borderRadius="xl"
      backgroundImage={getCommunityImage(community)}
      backgroundRepeat="no-repeat"
      backgroundSize="cover"
      backgroundPosition="center"
      textShadow="2px 2px var(--chakra-blur-sm) var(--chakra-colors-blackAlpha-800)"
      {...props}
    >
      <CardHeader pb="0">
        <Heading size="lg">
          <LinkOverlay as={RouterLink} to={`/c/${encodeURIComponent(name)}/${nip19.npubEncode(community.pubkey)}`}>
            {name}
          </LinkOverlay>
        </Heading>
      </CardHeader>
      <CardFooter display="flex" alignItems="center" gap="2" pt="0">
        <UserAvatarLink pubkey={community.pubkey} size="sm" />
        <Text>by</Text>
        <UserLink pubkey={community.pubkey} />
      </CardFooter>
    </Card>
  );
}
