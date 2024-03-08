import { Box, ButtonGroup, Card, CardProps, Flex, Heading, Link, Text, useDisclosure } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import {
  getCommunityDescription,
  getCommunityLinks,
  getCommunityMods,
  getCommunityRelays,
  getCommunityRules,
} from "../../../helpers/nostr/communities";
import CommunityDescription from "../../communities/components/community-description";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import { NostrEvent } from "../../../types/nostr-event";
import CommunityJoinButton from "../../communities/components/community-join-button";
import CommunityMenu from "./community-menu";
import useCountCommunityMembers from "../../../hooks/use-count-community-members";
import CommunityMembersModal from "./community-members-modal";
import { readablizeSats } from "../../../helpers/bolt11";
import { RelayFavicon } from "../../../components/relay-favicon";

export default function VerticalCommunityDetails({
  community,
  onEditClick,
  ...props
}: Omit<CardProps, "children"> & { community: NostrEvent; onEditClick?: () => void }) {
  const membersModal = useDisclosure();
  const communityRelays = getCommunityRelays(community);
  const mods = getCommunityMods(community);
  const description = getCommunityDescription(community);
  const rules = getCommunityRules(community);
  const links = getCommunityLinks(community);

  const countMembers = useCountCommunityMembers(community);

  return (
    <>
      <Card p="4" gap="4" {...props}>
        {description && (
          <Box>
            <Heading size="sm" mb="1">
              About
            </Heading>
            <CommunityDescription community={community} maxLength={256} showExpand />
          </Box>
        )}
        <ButtonGroup w="full">
          <CommunityJoinButton community={community} flex={1} />
          <CommunityMenu community={community} aria-label="More" onEditClick={onEditClick} />
        </ButtonGroup>
        <Box>
          <Heading size="sm" mb="1">
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
        </Box>
        <Box as="button" textAlign="start" cursor="pointer" onClick={membersModal.onOpen}>
          <Heading size="sm" mb="1">
            Members
          </Heading>
          <Text>{countMembers ? readablizeSats(countMembers) : "unknown"}</Text>
        </Box>
        {rules && (
          <Box>
            <Heading size="sm" mb="1">
              Rules
            </Heading>
            <Text whiteSpace="pre-wrap">{rules}</Text>
          </Box>
        )}
        {communityRelays.length > 0 && (
          <Box>
            <Heading size="sm" mb="1">
              Relays
            </Heading>
            <Flex direction="column" gap="2">
              {communityRelays.map((url) => (
                <Flex key={url} alignItems="center" gap="2">
                  <RelayFavicon relay={url} size="xs" />
                  <Link as={RouterLink} to={`/r/${encodeURIComponent(url)}`} fontWeight="bold" isTruncated>
                    {url}
                  </Link>
                </Flex>
              ))}
            </Flex>
          </Box>
        )}
        {links.length > 0 && (
          <Box>
            <Heading size="sm" mb="1">
              Links
            </Heading>
            <Box>
              {links.map(([url, name]) => (
                <Link href={url} isTruncated isExternal display="block">
                  {name || url}
                </Link>
              ))}
            </Box>
          </Box>
        )}
      </Card>
      {membersModal.isOpen && (
        <CommunityMembersModal isOpen={membersModal.isOpen} onClose={membersModal.onClose} community={community} />
      )}
    </>
  );
}
