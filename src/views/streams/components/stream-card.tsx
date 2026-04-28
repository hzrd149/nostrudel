import {
  Badge,
  Box,
  ButtonGroup,
  Card,
  CardBody,
  CardProps,
  Flex,
  Heading,
  LinkBox,
  LinkOverlay,
} from "@chakra-ui/react";
import { Stream } from "applesauce-common/casts";
import { memo } from "react";
import { Link as RouterLink } from "react-router-dom";

import StreamMenuButton from "./stream-menu";
import Timestamp from "../../../components/timestamp";
import UserAvatar from "../../../components/user/user-avatar";
import UserDnsIdentityIcon from "../../../components/user/user-dns-identity-icon";
import UserLink from "../../../components/user/user-link";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import StreamStatusBadge from "./status-badge";
import StreamFavoriteButton from "./stream-favorite-button";

function StreamCard({ stream, ...props }: CardProps & { stream: Stream }) {
  const host = stream.host.pubkey;
  const viewers = stream.viewers;

  // if there is a parent intersection observer, register this card
  const ref = useEventIntersectionRef(stream.event);

  const naddr = useShareableEventAddress(stream.event, stream.relays);

  return (
    <Card as={LinkBox} {...props} ref={ref} position="relative">
      <Flex direction="column" gap="1" position="absolute" top="2" left="2" alignItems="start" zIndex={1}>
        <StreamStatusBadge stream={stream} fontSize="md" />
        {viewers !== undefined && (
          <Badge variant="solid" colorScheme="black">
            {viewers} viewers
          </Badge>
        )}
      </Flex>

      <Box
        backgroundImage={stream.image}
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
        backgroundSize="cover"
        aspectRatio={16 / 9}
        borderRadius="lg"
      />

      <CardBody p="2" display="flex" gap="2">
        <UserAvatar pubkey={host} size="md" noProxy />

        <Flex direction="column" minW={0}>
          <Heading size="sm" noOfLines={1}>
            <LinkOverlay as={RouterLink} to={`/streams/${naddr}`}>
              {stream.title || "Untitled stream"}
            </LinkOverlay>
          </Heading>
          <div>
            <UserLink pubkey={host} /> <UserDnsIdentityIcon pubkey={host} />
          </div>
          {stream.startTime && <Timestamp timestamp={stream.startTime} fontSize="sm" display="block" />}
        </Flex>
      </CardBody>
      <ButtonGroup size="sm" variant="ghost" position="absolute" right="2" top="2" zIndex={1}>
        <StreamFavoriteButton stream={stream} />
        <StreamMenuButton stream={stream.event} aria-label="Stream options" />
      </ButtonGroup>
    </Card>
  );
}
export default memo(StreamCard);
