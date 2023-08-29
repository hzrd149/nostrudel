import { memo, useRef } from "react";
import dayjs from "dayjs";
import { Box, Card, CardBody, CardProps, Flex, Heading, LinkBox, LinkOverlay, Tag, Text } from "@chakra-ui/react";

import { ParsedStream } from "../../../helpers/nostr/stream";
import { Link as RouterLink } from "react-router-dom";
import { UserAvatar } from "../../../components/user-avatar";
import { UserLink } from "../../../components/user-link";
import StreamStatusBadge from "./status-badge";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import useEventNaddr from "../../../hooks/use-event-naddr";
import { getEventUID } from "../../../helpers/nostr/events";

function StreamCard({ stream, ...props }: CardProps & { stream: ParsedStream }) {
  const { title, image } = stream;

  // if there is a parent intersection observer, register this card
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(stream.event));

  const naddr = useEventNaddr(stream.event, stream.relays);

  return (
    <Card {...props} ref={ref} position="relative">
      <LinkBox as={CardBody} p="2" display="flex" flexDirection="column" gap="2">
        <StreamStatusBadge stream={stream} position="absolute" top="4" left="4" />
        <Box
          backgroundImage={image}
          backgroundPosition="center"
          backgroundRepeat="no-repeat"
          backgroundSize="cover"
          aspectRatio={16 / 9}
          borderRadius="lg"
        />
        <Flex gap="2" alignItems="center">
          <UserAvatar pubkey={stream.host} size="sm" noProxy />
          <Heading size="sm">
            <UserLink pubkey={stream.host} />
          </Heading>
        </Flex>
        <Heading size="md">
          <LinkOverlay as={RouterLink} to={`/streams/${naddr}`}>
            {title}
          </LinkOverlay>
        </Heading>
        {stream.tags.length > 0 && (
          <Flex gap="2" wrap="wrap">
            {stream.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Flex>
        )}
        {stream.starts && <Text>Started: {dayjs.unix(stream.starts).fromNow()}</Text>}
      </LinkBox>
    </Card>
  );
}
export default memo(StreamCard);
