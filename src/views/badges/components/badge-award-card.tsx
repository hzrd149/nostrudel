import { memo, useRef } from "react";
import { Button, Card, Flex, Image, Link, LinkBox, Text, useDisclosure } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { getBadgeAwardBadge, getBadgeAwardPubkeys, getBadgeImage, getBadgeName } from "../../../helpers/nostr/badges";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import { NostrEvent } from "../../../types/nostr-event";
import { useRegisterIntersectionEntity } from "../../../providers/local/intersection-observer";
import { getEventUID } from "../../../helpers/nostr/event";
import { getSharableEventAddress } from "../../../helpers/nip19";
import UserLink from "../../../components/user/user-link";
import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user/user-avatar-link";

const UserCard = memo(({ pubkey }: { pubkey: string }) => (
  <Flex gap="2" alignItems="center">
    <UserAvatarLink pubkey={pubkey} size="sm" />
    <UserLink pubkey={pubkey} fontWeight="bold" isTruncated />
  </Flex>
));

export default function BadgeAwardCard({ award, showImage = true }: { award: NostrEvent; showImage?: boolean }) {
  const badge = useReplaceableEvent(getBadgeAwardBadge(award));
  const showAll = useDisclosure();

  // if there is a parent intersection observer, register this card
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(award));

  if (!badge) return null;

  const awards = getBadgeAwardPubkeys(award);
  const collapsed = !showAll.isOpen && awards.length > 10;

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
          {(collapsed ? awards.slice(0, 10) : awards).map(({ pubkey }) => (
            <UserCard key={pubkey} pubkey={pubkey} />
          ))}
          {collapsed && (
            <Button variant="ghost" onClick={showAll.onOpen}>
              Show {awards.length - 10} more
            </Button>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}
