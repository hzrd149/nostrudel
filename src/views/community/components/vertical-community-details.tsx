import { Box, ButtonGroup, Card, CardProps, Flex, Heading, Text } from "@chakra-ui/react";
import {
  getCommunityDescription,
  getCommunityMods,
  getCommunityRelays,
  getCommunityRules,
} from "../../../helpers/nostr/communities";
import CommunityDescription from "../../communities/components/community-description";
import { UserAvatarLink } from "../../../components/user-avatar-link";
import { UserLink } from "../../../components/user-link";
import { RelayIconStack } from "../../../components/relay-icon-stack";
import { NostrEvent } from "../../../types/nostr-event";
import CommunityJoinButton from "../../communities/components/community-subscribe-button";
import CommunityMenu from "./community-menu";

export default function VerticalCommunityDetails({
  community,
  ...props
}: Omit<CardProps, "children"> & { community: NostrEvent }) {
  const communityRelays = getCommunityRelays(community);
  const mods = getCommunityMods(community);
  const description = getCommunityDescription(community);
  const rules = getCommunityRules(community);

  return (
    <Card p="4" {...props}>
      {description && (
        <>
          <Heading size="sm" mb="2">
            About
          </Heading>
          <CommunityDescription community={community} maxLength={256} showExpand />
        </>
      )}
      <ButtonGroup w="full" my="2">
        <CommunityJoinButton community={community} flex={1} />
        <CommunityMenu community={community} aria-label="More" />
      </ButtonGroup>
      <Heading size="sm" mt="4" mb="2">
        Mods
      </Heading>
      <Flex direction="column" gap="2">
        {mods.map((pubkey) => (
          <Flex gap="2">
            <UserAvatarLink pubkey={pubkey} size="xs" />
            <UserLink pubkey={pubkey} />
          </Flex>
        ))}
      </Flex>
      {rules && (
        <>
          <Heading size="sm" mt="4" mb="2">
            Rules
          </Heading>
          <Text whiteSpace="pre-wrap">{rules}</Text>
        </>
      )}
      {communityRelays.length > 0 && (
        <>
          <Heading size="sm" mt="4" mb="2">
            Relays
          </Heading>
          <Flex direction="column" gap="2">
            <RelayIconStack relays={communityRelays} />
          </Flex>
        </>
      )}
    </Card>
  );
}
