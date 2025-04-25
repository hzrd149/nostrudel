import { Button, Card, Flex, Image, Link, LinkBox, Text, useDisclosure } from "@chakra-ui/react";
import { memo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { NostrEvent } from "nostr-tools";

import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import { getBadgeAwardBadge, getBadgeAwardPubkeys, getBadgeImage, getBadgeName } from "../../../helpers/nostr/badges";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";

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
  const ref = useEventIntersectionRef(award);

  if (!badge) return null;

  const awards = getBadgeAwardPubkeys(award);
  const collapsed = !showAll.isOpen && awards.length > 10;

  const address = useShareableEventAddress(badge);
  return (
    <Card as={LinkBox} p="2" variant="outline" gap="2" flexDirection={["column", null, "row"]} ref={ref}>
      {showImage && (
        <Flex as={RouterLink} to={`/badges/${address}`} direction="column" overflow="hidden" gap="2" w="40" mx="auto">
          <Image aspectRatio={1} src={getBadgeImage(badge)?.src ?? ""} w="40" />
        </Flex>
      )}
      <Flex gap="2" direction="column" flex={1}>
        <Flex gap="2" alignItems="center" wrap="wrap">
          <UserAvatarLink pubkey={award.pubkey} size="sm" />
          <UserLink pubkey={award.pubkey} fontWeight="bold" />
          <Text>Awarded</Text>
          <Link as={RouterLink} to={`/badges/${address}`} fontWeight="bold">
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
