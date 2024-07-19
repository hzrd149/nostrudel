import { memo } from "react";
import { Box, Card, CardBody, CardProps, Flex, Heading, LinkBox, LinkOverlay, Text } from "@chakra-ui/react";

import { ParsedStream } from "../../../helpers/nostr/stream";
import { Link as RouterLink } from "react-router-dom";
import UserAvatar from "../../../components/user/user-avatar";
import UserLink from "../../../components/user/user-link";
import StreamStatusBadge from "./status-badge";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import StreamHashtags from "./stream-hashtags";
import Timestamp from "../../../components/timestamp";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";

function StreamCard({ stream, ...props }: CardProps & { stream: ParsedStream }) {
  const { title, image } = stream;

  // if there is a parent intersection observer, register this card
  const ref = useEventIntersectionRef(stream.event);

  const naddr = useShareableEventAddress(stream.event, stream.relays);

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
            <StreamHashtags stream={stream} />
          </Flex>
        )}
        {stream.starts && (
          <Text>
            Started: <Timestamp timestamp={stream.starts} />
          </Text>
        )}
      </LinkBox>
    </Card>
  );
}
export default memo(StreamCard);
