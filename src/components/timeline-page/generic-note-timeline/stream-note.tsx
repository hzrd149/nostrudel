import {
  Badge,
  Card,
  CardBody,
  CardFooter,
  CardProps,
  Divider,
  Flex,
  Heading,
  Image,
  LinkBox,
  LinkOverlay,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router";
import { NostrEvent } from "nostr-tools";

import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import UserAvatar from "../../user/user-avatar";
import UserLink from "../../user/user-link";
import StreamStatusBadge from "../../../views/streams/components/status-badge";
import Timestamp from "../../timestamp";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import { getStreamHashtags, getStreamHost, getStreamImage, getStreamTitle } from "../../../helpers/nostr/stream";

export default function StreamNote({ stream, ...props }: CardProps & { stream: NostrEvent }) {
  const ref = useEventIntersectionRef(stream);
  const naddr = useShareableEventAddress(stream);

  const host = getStreamHost(stream);
  const title = getStreamTitle(stream);
  const image = getStreamImage(stream);
  const tags = getStreamHashtags(stream);

  return (
    <Card {...props} ref={ref}>
      <LinkBox as={CardBody} p="2" display="flex" flexDirection="column" gap="2">
        <Flex gap="2">
          <Flex gap="2" direction="column">
            <Flex gap="2" alignItems="center">
              <UserAvatar pubkey={host} size="sm" noProxy />
              <Heading size="sm">
                <UserLink pubkey={host} />
              </Heading>
            </Flex>
            {image && <Image src={image} alt={title} borderRadius="lg" maxH="15rem" />}
            <Heading size="md">
              <LinkOverlay as={RouterLink} to={`/streams/${naddr}`}>
                {title}
              </LinkOverlay>
            </Heading>
          </Flex>
        </Flex>
        {tags.length > 0 && (
          <Flex gap="2" wrap="wrap">
            {tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </Flex>
        )}
        <Text>
          Updated:
          <Timestamp timestamp={stream.created_at} />
        </Text>
      </LinkBox>
      <Divider />
      <CardFooter p="2" display="flex" gap="2" alignItems="center">
        <StreamStatusBadge stream={stream} />
      </CardFooter>
    </Card>
  );
}
