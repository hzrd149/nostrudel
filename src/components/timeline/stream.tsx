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
  Spinner,
  Text,
} from "@chakra-ui/react";
import { Stream } from "applesauce-common/casts";
import { NostrEvent } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import useCastEvent from "../../hooks/use-cast-event";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import useShareableEventAddress from "../../hooks/use-shareable-event-address";
import StreamStatusBadge from "../../views/streams/components/status-badge";
import Timestamp from "../timestamp";
import UserAvatar from "../user/user-avatar";
import UserLink from "../user/user-link";

export default function StreamNote({ stream, ...props }: CardProps & { stream: NostrEvent }) {
  const ref = useEventIntersectionRef(stream);
  const naddr = useShareableEventAddress(stream);
  const cast = useCastEvent(stream, Stream);

  const host = cast?.host.pubkey ?? stream.pubkey;
  const title = cast?.title;
  const image = cast?.image;
  const tags = cast?.hashtags ?? [];

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
                {title || "Untitled stream"}
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
        {cast ? <StreamStatusBadge stream={cast} /> : <Spinner size="xs" />}
      </CardFooter>
    </Card>
  );
}
