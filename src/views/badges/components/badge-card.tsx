import { ButtonGroup, Card, CardBody, CardHeader, CardProps, Flex, Heading, Image, Link, Text } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { memo } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { getReplaceableAddress } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import { getBadgeImage, getBadgeName } from "../../../helpers/nostr/badges";
import useEventCount from "../../../hooks/use-event-count";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import BadgeMenu from "./badge-menu";

function BadgeCard({ badge, ...props }: Omit<CardProps, "children"> & { badge: NostrEvent }) {
  const address = useShareableEventAddress(badge);
  const image = getBadgeImage(badge);
  const navigate = useNavigate();

  // if there is a parent intersection observer, register this card
  const ref = useEventIntersectionRef(badge);

  const timesAwarded = useEventCount({ kinds: [kinds.BadgeAward], "#a": [getReplaceableAddress(badge)] });

  return (
    <Card ref={ref} variant="outline" {...props}>
      {image && (
        <Image src={image.src} cursor="pointer" onClick={() => navigate(`/badges/${address}`)} borderRadius="lg" />
      )}
      <CardHeader display="flex" alignItems="center" p="2" pb="0">
        <Heading size="md">
          <Link as={RouterLink} to={`/badges/${address}`}>
            {getBadgeName(badge)}
          </Link>
        </Heading>
        <ButtonGroup size="sm" ml="auto">
          <BadgeMenu badge={badge} aria-label="badge menu" />
        </ButtonGroup>
      </CardHeader>
      <CardBody p="2">
        <Flex gap="2">
          <Text>Created by:</Text>
          <UserAvatarLink pubkey={badge.pubkey} size="xs" />
          <UserLink pubkey={badge.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
        </Flex>
        <Text>
          Updated: <Timestamp timestamp={badge.created_at} />
        </Text>
        <Text>Times Awarded: {timesAwarded}</Text>
      </CardBody>
    </Card>
  );
}

export default memo(BadgeCard);
