import { Card, CardBody, CardProps, Flex, Heading, Image, Link, Tag, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import {
  getStreamHashtags,
  getStreamHost,
  getStreamImage,
  getStreamRelays,
  getStreamStartTime,
  getStreamTitle,
} from "../../../helpers/nostr/stream";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import StreamStatusBadge from "../../../views/streams/components/status-badge";
import Timestamp from "../../timestamp";
import UserAvatar from "../../user/user-avatar";
import UserLink from "../../user/user-link";

export default function EmbeddedStream({ stream, ...props }: Omit<CardProps, "children"> & { stream: NostrEvent }) {
  const naddr = useShareableEventAddress(stream, getStreamRelays(stream));
  const isVertical = useBreakpointValue({ base: true, md: false });
  const navigate = useNavigate();

  const host = getStreamHost(stream);
  const starts = getStreamStartTime(stream);
  const hashtags = getStreamHashtags(stream);

  return (
    <Card {...props} position="relative">
      <CardBody p="2" gap="2">
        <StreamStatusBadge stream={stream} position="absolute" top="4" left="4" />
        {isVertical ? (
          <Image
            src={getStreamImage(stream)}
            borderRadius="md"
            cursor="pointer"
            onClick={() => navigate(`/streams/${naddr}`)}
            maxH="2in"
            mx="auto"
            mb="2"
          />
        ) : (
          <Image
            src={getStreamImage(stream)}
            borderRadius="md"
            maxH="2in"
            maxW="30%"
            mr="2"
            float="left"
            cursor="pointer"
            onClick={() => navigate(`/streams/${naddr}`)}
          />
        )}

        <Heading size="md">
          <Link as={RouterLink} to={`/streams/${naddr}`}>
            {getStreamTitle(stream)}
          </Link>
        </Heading>
        <Flex gap="2" alignItems="center" my="2">
          <UserAvatar pubkey={host} size="xs" noProxy />
          <Heading size="sm">
            <UserLink pubkey={host} />
          </Heading>
        </Flex>

        {starts && (
          <Text>
            Started: <Timestamp timestamp={starts} />
          </Text>
        )}
        {hashtags.length > 0 && (
          <Flex gap="2" wrap="wrap">
            {hashtags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Flex>
        )}
      </CardBody>
    </Card>
  );
}
