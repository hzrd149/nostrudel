import { useMemo, useState } from "react";
import { useAsync } from "react-use";
import { nip19, NostrEvent } from "nostr-tools";
import { Button, ButtonGroup, Flex, LinkBox, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import UserAvatar from "../../../components/user/user-avatar";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import trustedUserStatsService from "../../../services/trusted-user-stats";
import { humanReadableSats } from "../../../helpers/lightning";
import UserAboutContent from "../../../components/user/user-about-content";
import UserName from "../../../components/user/user-name";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import { sortByDistanceAndConnections } from "../../../services/social-graph";

function ProfileResult({ profile }: { profile: NostrEvent }) {
  const { value: stats } = useAsync(() => trustedUserStatsService.getUserStats(profile.pubkey), [profile.pubkey]);

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

export default function ProfileSearchResults({ profiles }: { profiles: NostrEvent[] }) {
  const [order, setOrder] = useState("relay");

  const sorted = useMemo(() => {
    switch (order) {
      case "trust":
        return sortByDistanceAndConnections(profiles, (p) => p.pubkey) || profiles;
      default:
      case "relay":
        return profiles;
    }
  }, [order, profiles]);

  return (
    <>
      <Flex gap="2">
        <Text>Order By:</Text>
        <ButtonGroup size="xs">
          <Button variant={order === "relay" ? "solid" : "outline"} onClick={() => setOrder("relay")}>
            Relay order
          </Button>
          <Button variant={order === "trust" ? "solid" : "outline"} onClick={() => setOrder("trust")}>
            Trust
          </Button>
        </ButtonGroup>
      </Flex>
      <Flex gap="2" overflowY="hidden" overflowX="auto" w="full" px="2" pb="2">
        {sorted.map((profile) => (
          <ProfileResult key={profile.pubkey} profile={profile} />
        ))}
      </Flex>
    </>
  );
}
