import { nip19 } from "nostr-tools";
import { Flex, LinkBox } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import UserAvatar from "../../../components/user/user-avatar";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import UserAboutContent from "../../../components/user/user-about-content";
import UserName from "../../../components/user/user-name";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import { SearchResult } from "../../../services/user-lookup";

function ProfileResult({ profile }: { profile: SearchResult }) {
  return (
    <Flex
      as={LinkBox}
      overflow="hidden"
      direction="column"
      borderWidth={1}
      rounded="md"
      p="2"
      flexShrink={0}
      maxW="xs"
      minW="48"
    >
      <Flex gap="2" overflow="hidden">
        <UserAvatar pubkey={profile.pubkey} float="left" />
        <Flex direction="column" overflow="hidden">
          <HoverLinkOverlay as={RouterLink} to={"/u/" + nip19.npubEncode(profile.pubkey)}>
            <UserName pubkey={profile.pubkey} fontSize="xl" isTruncated />
          </HoverLinkOverlay>
          <UserDnsIdentity pubkey={profile.pubkey} isTruncated />
        </Flex>
      </Flex>
      <UserAboutContent pubkey={profile.pubkey} noOfLines={3} isTruncated />
    </Flex>
  );
}

export default function ProfileSearchResults({ profiles }: { profiles: SearchResult[] }) {
  return (
    <Flex gap="2" overflowY="hidden" overflowX="auto" w="full" px="2" pb="2">
      {profiles.map((profile) => (
        <ProfileResult key={profile.pubkey} profile={profile} />
      ))}
    </Flex>
  );
}
