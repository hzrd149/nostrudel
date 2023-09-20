import { Link as RouterLink } from "react-router-dom";
import { Box, Card, CardProps, Center, Flex, Heading, LinkBox, LinkOverlay, Text } from "@chakra-ui/react";
import { nip19 } from "nostr-tools";

import { UserAvatarLink } from "../../../components/user-avatar-link";
import { UserLink } from "../../../components/user-link";
import { NostrEvent } from "../../../types/nostr-event";
import { getCommunityImage, getCommunityName } from "../../../helpers/nostr/communities";
import CommunityDescription from "../../../views/communities/components/community-description";

export default function EmbeddedCommunity({
  community,
  ...props
}: Omit<CardProps, "children"> & { community: NostrEvent }) {
  const image = getCommunityImage(community);

  return (
    <Card as={LinkBox} variant="outline" gap="2" overflow="hidden" {...props}>
      {image ? (
        <Box
          backgroundImage={getCommunityImage(community)}
          backgroundRepeat="no-repeat"
          backgroundSize="cover"
          backgroundPosition="center"
          aspectRatio={3 / 1}
        />
      ) : (
        <Center aspectRatio={4 / 1} fontWeight="bold" fontSize="2xl">
          {getCommunityName(community)}
        </Center>
      )}
      <Flex direction="column" flex={1} px="2" pb="2">
        <Flex wrap="wrap" gap="2" alignItems="center">
          <Heading size="lg">
            <LinkOverlay
              as={RouterLink}
              to={`/c/${encodeURIComponent(getCommunityName(community))}/${nip19.npubEncode(community.pubkey)}`}
            >
              {getCommunityName(community)}
            </LinkOverlay>
          </Heading>
          <Text>Created by:</Text>
          <UserAvatarLink pubkey={community.pubkey} size="xs" /> <UserLink pubkey={community.pubkey} />
        </Flex>
        <CommunityDescription community={community} maxLength={128} flex={1} />
      </Flex>
    </Card>
  );
}
