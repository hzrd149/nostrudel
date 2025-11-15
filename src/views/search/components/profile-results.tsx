import { useAsync } from "react-use";
import { nip19 } from "nostr-tools";
import { Flex, LinkBox, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import UserAvatar from "../../../components/user/user-avatar";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import trustedUserStatsService from "../../../services/trusted-user-stats";
import { humanReadableSats } from "../../../helpers/lightning";
import UserAboutContent from "../../../components/user/user-about-content";
import UserName from "../../../components/user/user-name";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import { SearchResult } from "../../../services/username-search";

// Simple cache for user stats to prevent duplicate requests
const statsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const pendingRequests = new Map<string, Promise<any>>();

function getCachedStats(pubkey: string): any | null {
  const cached = statsCache.get(pubkey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedStats(pubkey: string, data: any) {
  statsCache.set(pubkey, { data, timestamp: Date.now() });
}

async function fetchUserStats(pubkey: string): Promise<any> {
  // Check cache first
  const cached = getCachedStats(pubkey);
  if (cached !== null) {
    return cached;
  }

  // Check if there's already a pending request for this pubkey
  if (pendingRequests.has(pubkey)) {
    return pendingRequests.get(pubkey);
  }

  // Create new request
  const request = trustedUserStatsService
    .getUserStats(pubkey)
    .then((stats) => {
      setCachedStats(pubkey, stats);
      pendingRequests.delete(pubkey);
      return stats;
    })
    .catch((error) => {
      pendingRequests.delete(pubkey);
      throw error;
    });

  pendingRequests.set(pubkey, request);
  return request;
}

function ProfileResult({ profile }: { profile: SearchResult }) {
  const { value: stats } = useAsync(() => fetchUserStats(profile.pubkey), [profile.pubkey]);

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
      {stats && (
        <>{stats.followers_pubkey_count && <Text>Followers: {humanReadableSats(stats.followers_pubkey_count)}</Text>}</>
      )}
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
