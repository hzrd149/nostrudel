import { Button, Card, Flex, Image, Link, LinkBox, Text, useDisclosure } from "@chakra-ui/react";
import { Badge, BadgeAward } from "applesauce-common/casts";
import { use$ } from "applesauce-react/hooks";
import { memo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { NostrEvent } from "nostr-tools";

import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import useCastEvent from "../../../hooks/use-cast-event";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";

const UserCard = memo(({ pubkey }: { pubkey: string }) => (
  <Flex gap="2" alignItems="center">
    <UserAvatarLink pubkey={pubkey} size="sm" />
    <UserLink pubkey={pubkey} fontWeight="bold" isTruncated />
  </Flex>
));

function BadgeAwardCardBody({ award, badge, showImage }: { award: BadgeAward; badge: Badge; showImage: boolean }) {
  const showAll = useDisclosure();

  // if there is a parent intersection observer, register this card
  const ref = useEventIntersectionRef(award.event);
  const address = useShareableEventAddress(badge.event);

  const recipients = award.recipients;
  const collapsed = !showAll.isOpen && recipients.length > 10;

  return (
    <Card as={LinkBox} p="2" variant="outline" gap="2" flexDirection={["column", null, "row"]} ref={ref}>
      {showImage && (
        <Flex as={RouterLink} to={`/badges/${address}`} direction="column" overflow="hidden" gap="2" w="40" mx="auto">
          <Image aspectRatio={1} src={badge.image?.url ?? ""} w="40" />
        </Flex>
      )}
      <Flex gap="2" direction="column" flex={1}>
        <Flex gap="2" alignItems="center" wrap="wrap">
          <UserAvatarLink pubkey={award.event.pubkey} size="sm" />
          <UserLink pubkey={award.event.pubkey} fontWeight="bold" />
          <Text>Awarded</Text>
          <Link as={RouterLink} to={`/badges/${address}`} fontWeight="bold">
            {badge.name}
          </Link>
          <Text>To</Text>
          <Timestamp timestamp={award.event.created_at} ml="auto" />
        </Flex>
        <Flex gap="4" wrap="wrap">
          {(collapsed ? recipients.slice(0, 10) : recipients).map(({ pubkey }) => (
            <UserCard key={pubkey} pubkey={pubkey} />
          ))}
          {collapsed && (
            <Button variant="ghost" onClick={showAll.onOpen}>
              Show {recipients.length - 10} more
            </Button>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}

export default function BadgeAwardCard({ award, showImage = true }: { award: NostrEvent; showImage?: boolean }) {
  const cast = useCastEvent(award, BadgeAward);
  const badge = use$(cast?.badge$);

  if (!cast || !badge) return null;

  return <BadgeAwardCardBody award={cast} badge={badge} showImage={showImage} />;
}
