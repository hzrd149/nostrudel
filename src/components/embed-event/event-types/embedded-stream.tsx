import { Card, CardBody, CardProps, Flex, Heading, Image, Link, Tag, Text, useBreakpointValue } from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { parseStreamEvent } from "../../../helpers/nostr/stream";
import { NostrEvent } from "../../../types/nostr-event";
import StreamStatusBadge from "../../../views/streams/components/status-badge";
import { UserLink } from "../../user-link";
import { UserAvatar } from "../../user-avatar";
import useEventNaddr from "../../../hooks/use-event-naddr";
import Timestamp from "../../timestamp";

export default function EmbeddedStream({ event, ...props }: Omit<CardProps, "children"> & { event: NostrEvent }) {
  const stream = parseStreamEvent(event);
  const naddr = useEventNaddr(stream.event, stream.relays);
  const isVertical = useBreakpointValue({ base: true, md: false });
  const navigate = useNavigate();

  return (
    <Card {...props} position="relative">
      <CardBody p="2" gap="2">
        <StreamStatusBadge stream={stream} position="absolute" top="4" left="4" />
        {isVertical ? (
          <Image
            src={stream.image}
            borderRadius="md"
            cursor="pointer"
            onClick={() => navigate(`/streams/${naddr}`)}
            maxH="2in"
            mx="auto"
            mb="2"
          />
        ) : (
          <Image
            src={stream.image}
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
            {stream.title}
          </Link>
        </Heading>
        <Flex gap="2" alignItems="center" my="2">
          <UserAvatar pubkey={stream.host} size="xs" noProxy />
          <Heading size="sm">
            <UserLink pubkey={stream.host} />
          </Heading>
        </Flex>

        {stream.starts && (
          <Text>
            Started: <Timestamp timestamp={stream.starts} />
          </Text>
        )}
        {stream.tags.length > 0 && (
          <Flex gap="2" wrap="wrap">
            {stream.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Flex>
        )}
      </CardBody>
    </Card>
  );
}
