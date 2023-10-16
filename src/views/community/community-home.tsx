import { Box, Button, ButtonGroup, Card, Flex, Heading, Text } from "@chakra-ui/react";
import { Outlet, Link as RouterLink, useLocation } from "react-router-dom";
import { nip19 } from "nostr-tools";

import {
  getCommunityRelays as getCommunityRelays,
  getCommunityImage,
  getCommunityMods,
  getCommunityName,
  getCommunityDescription,
} from "../../helpers/nostr/communities";
import { NostrEvent } from "../../types/nostr-event";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { UserAvatarLink } from "../../components/user-avatar-link";
import { UserLink } from "../../components/user-link";
import CommunityDescription from "../communities/components/community-description";
import CommunityJoinButton from "../communities/components/community-subscribe-button";
import { AdditionalRelayProvider } from "../../providers/additional-relay-context";
import { RelayIconStack } from "../../components/relay-icon-stack";

import TrendUp01 from "../../components/icons/trend-up-01";
import Clock from "../../components/icons/clock";
import Hourglass03 from "../../components/icons/hourglass-03";

function CommunityDetails({ community }: { community: NostrEvent }) {
  const communityRelays = getCommunityRelays(community);
  const mods = getCommunityMods(community);
  const description = getCommunityDescription(community);

  return (
    <Card p="4" w="xs" flexShrink={0}>
      {description && (
        <>
          <Heading size="sm" mb="2">
            Description:
          </Heading>
          <CommunityDescription community={community} maxLength={256} showExpand />
        </>
      )}
      <Heading size="sm" mt="4" mb="2">
        Moderators:
      </Heading>
      <Flex direction="column" gap="2">
        {mods.map((pubkey) => (
          <Flex gap="2">
            <UserAvatarLink pubkey={pubkey} size="xs" />
            <UserLink pubkey={pubkey} />
          </Flex>
        ))}
      </Flex>
      {communityRelays.length > 0 && (
        <>
          <Heading size="sm" mt="4" mb="2">
            Relays:
          </Heading>
          <Flex direction="column" gap="2">
            <RelayIconStack relays={communityRelays} />
          </Flex>
        </>
      )}
    </Card>
  );
}

function getCommunityPath(community: NostrEvent) {
  return `/c/${encodeURIComponent(getCommunityName(community))}/${nip19.npubEncode(community.pubkey)}`;
}

export default function CommunityHomePage({ community }: { community: NostrEvent }) {
  const image = getCommunityImage(community);
  const location = useLocation();

  const communityRelays = getCommunityRelays(community);

  let active = "new";
  if (location.pathname.endsWith("/pending")) active = "pending";

  return (
    <AdditionalRelayProvider relays={communityRelays}>
      <VerticalPageLayout pt={image && "0"}>
        {image && (
          <Box
            backgroundImage={getCommunityImage(community)}
            backgroundRepeat="no-repeat"
            backgroundSize="cover"
            backgroundPosition="center"
            aspectRatio={3 / 1}
            backgroundColor="rgba(0,0,0,0.2)"
          />
        )}
        <Flex wrap="wrap" gap="2" alignItems="center">
          <Heading size="lg">{getCommunityName(community)}</Heading>
          <Text>Created by:</Text>
          <Flex gap="2">
            <UserAvatarLink pubkey={community.pubkey} size="xs" /> <UserLink pubkey={community.pubkey} />
          </Flex>
          <CommunityJoinButton community={community} ml="auto" />
        </Flex>

        <Flex gap="4" alignItems="flex-start">
          <Flex direction="column" gap="4" flex={1}>
            <ButtonGroup size="sm">
              <Button leftIcon={<TrendUp01 />} isDisabled>
                Trending
              </Button>
              <Button
                leftIcon={<Clock />}
                as={RouterLink}
                to={getCommunityPath(community)}
                colorScheme={active === "new" ? "primary" : "gray"}
              >
                New
              </Button>
              <Button
                leftIcon={<Hourglass03 />}
                as={RouterLink}
                to={getCommunityPath(community) + "/pending"}
                colorScheme={active == "pending" ? "primary" : "gray"}
              >
                Pending
              </Button>
            </ButtonGroup>

            <Outlet context={{ community }} />
          </Flex>

          <CommunityDetails community={community} />
        </Flex>
      </VerticalPageLayout>
    </AdditionalRelayProvider>
  );
}
