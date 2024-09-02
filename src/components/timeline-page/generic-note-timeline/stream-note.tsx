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
  Spacer,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { NostrEvent } from "../../../types/nostr-event";
import { parseStreamEvent } from "../../../helpers/nostr/stream";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import UserAvatar from "../../user/user-avatar";
import UserLink from "../../user/user-link";
import StreamStatusBadge from "../../../views/streams/components/status-badge";
import { useAsync } from "react-use";
import Timestamp from "../../timestamp";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";

export default function StreamNote({ event, ...props }: CardProps & { event: NostrEvent }) {
  const { value: stream, error } = useAsync(async () => parseStreamEvent(event), [event]);
  const ref = useEventIntersectionRef(event);

  const naddr = useShareableEventAddress(event);

  if (!stream || error) return null;

  return (
    <Card {...props} ref={ref}>
      <LinkBox as={CardBody} p="2" display="flex" flexDirection="column" gap="2">
        <Flex gap="2">
          <Flex gap="2" direction="column">
            <Flex gap="2" alignItems="center">
              <UserAvatar pubkey={stream.host} size="sm" noProxy />
              <Heading size="sm">
                <UserLink pubkey={stream.host} />
              </Heading>
            </Flex>
            {stream.image && <Image src={stream.image} alt={stream.title} borderRadius="lg" maxH="15rem" />}
            <Heading size="md">
              <LinkOverlay as={RouterLink} to={`/streams/${naddr}`}>
                {stream.title}
              </LinkOverlay>
            </Heading>
          </Flex>
        </Flex>
        {stream.tags.length > 0 && (
          <Flex gap="2" wrap="wrap">
            {stream.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </Flex>
        )}
        <Text>
          Updated:
          <Timestamp timestamp={stream.updated} />
        </Text>
      </LinkBox>
      <Divider />
      <CardFooter p="2" display="flex" gap="2" alignItems="center">
        <StreamStatusBadge stream={stream} />
      </CardFooter>
    </Card>
  );
}
