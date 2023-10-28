import { Link as RouterLink } from "react-router-dom";
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

import UserAvatarLink from "../../../components/user-avatar-link";
import { UserLink } from "../../../components/user-link";
import { getSharableEventAddress } from "../../../helpers/nip19";
import { NostrEvent } from "../../../types/nostr-event";
import { getBadgeDescription, getBadgeImage, getBadgeName } from "../../../helpers/nostr/badges";

export default function EmbeddedBadge({ badge, ...props }: Omit<CardProps, "children"> & { badge: NostrEvent }) {
  const naddr = getSharableEventAddress(badge);
  const image = getBadgeImage(badge);

  return (
    <Card as={LinkBox} maxW="lg" {...props}>
      {image && <Image src={image.src} w="full" maxW="3in" maxH="3in" mx="auto" />}
      <CardHeader display="flex" alignItems="center" p="2" pb="0">
        <Heading size="md">
          <LinkOverlay as={RouterLink} to={`/badges/${naddr}`}>
            {getBadgeName(badge)}
          </LinkOverlay>
        </Heading>
      </CardHeader>
      <CardBody p="2">
        <Flex gap="2">
          <Text>Created by:</Text>
          <UserAvatarLink pubkey={badge.pubkey} size="xs" />
          <UserLink pubkey={badge.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
        </Flex>
        <Text>{getBadgeDescription(badge)}</Text>
      </CardBody>
    </Card>
  );
}
