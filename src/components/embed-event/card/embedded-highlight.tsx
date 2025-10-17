import { Card, CardBody, CardHeader, CardProps, Flex, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { hasHighlightSource } from "applesauce-core/helpers/highlight";

import { HighlightContent, HighlightSource } from "../../timeline/highlight";
import Timestamp from "../../timestamp";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";

export default function EmbeddedHighlight({
  highlight,
  ...cardProps
}: { highlight: NostrEvent } & Omit<CardProps, "children">) {
  // Extract highlight data using applesauce helpers
  const hasSource = hasHighlightSource(highlight);

  return (
    <Card {...cardProps}>
      <CardHeader p="3">
        <Flex gap="2" alignItems="center">
          <UserAvatarLink pubkey={highlight.pubkey} size="sm" />
          <UserLink pubkey={highlight.pubkey} fontWeight="bold" />
          <Timestamp timestamp={highlight.created_at} color="GrayText" />
        </Flex>
      </CardHeader>
      <CardBody p="3" pt="0">
        {/* Highlight Content */}
        <HighlightContent highlight={highlight} />

        {/* Source Attribution */}
        {hasSource && (
          <Flex alignItems="center" gap="2" mt="2">
            <Text fontSize="sm">From:</Text>
            <HighlightSource highlight={highlight} />
          </Flex>
        )}
      </CardBody>
    </Card>
  );
}
