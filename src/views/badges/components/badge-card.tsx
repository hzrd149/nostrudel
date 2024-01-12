import { memo, useRef } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { ButtonGroup, Card, CardBody, CardHeader, CardProps, Flex, Heading, Image, Link, Text } from "@chakra-ui/react";
import { kinds } from "nostr-tools";

import UserAvatarLink from "../../../components/user-avatar-link";
import UserLink from "../../../components/user-link";
import { getSharableEventAddress } from "../../../helpers/nip19";
import { NostrEvent } from "../../../types/nostr-event";
import { useRegisterIntersectionEntity } from "../../../providers/local/intersection-observer";
import { getEventCoordinate, getEventUID } from "../../../helpers/nostr/events";
import BadgeMenu from "./badge-menu";
import { getBadgeImage, getBadgeName } from "../../../helpers/nostr/badges";
import Timestamp from "../../../components/timestamp";
import useEventCount from "../../../hooks/use-event-count";

function BadgeCard({ badge, ...props }: Omit<CardProps, "children"> & { badge: NostrEvent }) {
  const naddr = getSharableEventAddress(badge);
  const image = getBadgeImage(badge);
  const navigate = useNavigate();

  // if there is a parent intersection observer, register this card
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(badge));

  const timesAwarded = useEventCount({ kinds: [kinds.BadgeAward], "#a": [getEventCoordinate(badge)] });

  return (
    <Card ref={ref} variant="outline" {...props}>
      {image && (
        <Image src={image.src} cursor="pointer" onClick={() => navigate(`/badges/${naddr}`)} borderRadius="lg" />
      )}
      <CardHeader display="flex" alignItems="center" p="2" pb="0">
        <Heading size="md">
          <Link as={RouterLink} to={`/badges/${naddr}`}>
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
