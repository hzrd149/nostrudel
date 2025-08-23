import { Box, Card, CardBody, CardHeader, Flex, Text, VStack } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { getTagValue } from "applesauce-core/helpers";
import { useMemo } from "react";
import StarRating from "../../../../components/star-rating";
import Timestamp from "../../../../components/timestamp";
import UserAvatar from "../../../../components/user/user-avatar";
import UserLink from "../../../../components/user/user-link";

export type BlossomServerReviewProps = {
  event: NostrEvent;
};

export default function BlossomServerReview({ event }: BlossomServerReviewProps) {
  const content = event.content;
  const rating = useMemo(() => {
    const str = getTagValue(event, "rating");
    if (!str) return 0;
    return parseFloat(str);
  }, [event]);

  return (
    <Card variant="outline">
      <CardHeader py="2" px="4">
        <Flex gap="2" alignItems="center">
          <UserAvatar pubkey={event.pubkey} size="sm" />
          <Box>
            <UserLink pubkey={event.pubkey} fontWeight="bold" />
            <StarRating quality={rating} boxSize="4" color="primary.500" />
          </Box>
          <Timestamp timestamp={event.created_at} color="gray.500" fontSize="sm" ms="auto" />
        </Flex>
      </CardHeader>
      <CardBody pt="0" px="4" pb="2">
        <Text whiteSpace="pre-wrap">{content}</Text>
      </CardBody>
    </Card>
  );
}
