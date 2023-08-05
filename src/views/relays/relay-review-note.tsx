import dayjs from "dayjs";
import { Box, Card, CardBody, CardHeader, Spacer, Text } from "@chakra-ui/react";

import { UserAvatarLink } from "../../components/user-avatar-link";
import { UserLink } from "../../components/user-link";
import { UserDnsIdentityIcon } from "../../components/user-dns-identity-icon";
import StarRating from "../../components/star-rating";
import { safeJson } from "../../helpers/parse";
import { NostrEvent } from "../../types/nostr-event";

export default function RelayReviewNote({ event }: { event: NostrEvent }) {
  const ratingJson = event.tags.find((t) => t[0] === "l" && t[3])?.[3];
  const rating = ratingJson ? (safeJson(ratingJson, undefined) as { quality: number } | undefined) : undefined;

  return (
    <Card variant="outline">
      <CardHeader display="flex" gap="2" px="2" pt="2" pb="0">
        <UserAvatarLink pubkey={event.pubkey} size="xs" />
        <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
        <UserDnsIdentityIcon pubkey={event.pubkey} onlyIcon />
        <Spacer />
        <Text>{dayjs.unix(event.created_at).fromNow()}</Text>
      </CardHeader>
      <CardBody p="2" gap="2" display="flex" flexDirection="column">
        {rating && <StarRating quality={rating.quality} color="yellow.400" />}
        <Box whiteSpace="pre-wrap">{event.content}</Box>
      </CardBody>
    </Card>
  );
}
