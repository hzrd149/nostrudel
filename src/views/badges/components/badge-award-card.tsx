import { useRef } from "react";
import { Card, Flex, Image, Link, LinkBox, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { getBadgeAwardBadge, getBadgeAwardPubkeys, getBadgeImage, getBadgeName } from "../../../helpers/nostr/badges";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import { NostrEvent } from "../../../types/nostr-event";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { getEventUID } from "../../../helpers/nostr/events";
import { getSharableEventAddress } from "../../../helpers/nip19";
import { UserLink } from "../../../components/user-link";
import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user-avatar-link";

export default function BadgeAwardCard({ award, showImage = true }: { award: NostrEvent; showImage?: boolean }) {
  const badge = useReplaceableEvent(getBadgeAwardBadge(award));

  // if there is a parent intersection observer, register this card
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(award));

  if (!badge) return null;

  const naddr = getSharableEventAddress(badge);
  return (
    <Card as={LinkBox} p="2" variant="outline" gap="2" flexDirection={["column", null, "row"]} ref={ref}>
      {showImage && (
        <Flex as={RouterLink} to={`/badges/${naddr}`} direction="column" overflow="hidden" gap="2" w="40" mx="auto">
          <Image aspectRatio={1} src={getBadgeImage(badge)?.src ?? ""} w="40" />
        </Flex>
      )}
      <Flex gap="2" direction="column" flex={1}>
        <Flex gap="2" alignItems="center" wrap="wrap">
          <UserAvatarLink pubkey={award.pubkey} size="sm" />
          <UserLink pubkey={award.pubkey} fontWeight="bold" />
          <Text>Awarded</Text>
          <Link as={RouterLink} to={`/badges/${naddr}`} fontWeight="bold">
            {getBadgeName(badge)}
          </Link>
          <Text>To</Text>
          <Timestamp timestamp={award.created_at} ml="auto" />
        </Flex>
        <Flex gap="4" wrap="wrap">
          {getBadgeAwardPubkeys(award).map(({ pubkey }) => (
            <Flex key={pubkey} gap="2" alignItems="center">
              <UserAvatarLink pubkey={pubkey} size="sm" />
              <UserLink pubkey={pubkey} fontWeight="bold" isTruncated />
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Card>
  );
}
