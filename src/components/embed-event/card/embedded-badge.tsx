import {
  Card,
  CardBody,
  CardHeader,
  CardProps,
  Flex,
  Heading,
  Image,
  LinkBox,
  LinkOverlay,
  Text,
} from "@chakra-ui/react";
import { Badge } from "applesauce-common/casts";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";

import useCastEvent from "../../../hooks/use-cast-event";
import { getSharableEventAddress } from "../../../services/relay-hints";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";

export default function EmbeddedBadge({ badge: event, ...props }: Omit<CardProps, "children"> & { badge: NostrEvent }) {
  const badge = useCastEvent(event, Badge);
  const naddr = useMemo(() => getSharableEventAddress(event), [event]);

  if (!badge) return null;
  const image = badge.image;

  return (
    <Card as={LinkBox} maxW="lg" {...props}>
      {image && <Image src={image.url} w="full" maxW="3in" maxH="3in" mx="auto" />}
      <CardHeader display="flex" alignItems="center" p="2" pb="0">
        <Heading size="md">
          <LinkOverlay as={RouterLink} to={`/badges/${naddr}`}>
            {badge.name}
          </LinkOverlay>
        </Heading>
      </CardHeader>
      <CardBody p="2">
        <Flex gap="2">
          <Text>Created by:</Text>
          <UserAvatarLink pubkey={event.pubkey} size="xs" />
          <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
        </Flex>
        <Text>{badge.description}</Text>
      </CardBody>
    </Card>
  );
}
