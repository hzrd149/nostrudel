import { memo } from "react";
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
import { NostrEvent } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import UserAvatar from "../../../components/user/user-avatar";
import UserLink from "../../../components/user/user-link";
import StreamStatusBadge from "./status-badge";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import Timestamp from "../../../components/timestamp";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import StreamFavoriteButton from "./stream-favorite-button";
import DebugEventButton from "../../../components/debug-modal/debug-event-button";
import {
  getStreamHost,
  getStreamImage,
  getStreamParticipants,
  getStreamRelays,
  getStreamStartTime,
  getStreamTitle,
} from "../../../helpers/nostr/stream";
import UserDnsIdentityIcon from "../../../components/user/user-dns-identity-icon";

function StreamCard({ stream, ...props }: CardProps & { stream: NostrEvent }) {
  const title = getStreamTitle(stream);
  const image = getStreamImage(stream);
  const host = getStreamHost(stream);
  const starts = getStreamStartTime(stream);
  const relays = getStreamRelays(stream);
  const viewers = getStreamParticipants(stream);

  // if there is a parent intersection observer, register this card
  const ref = useEventIntersectionRef(stream);

  const naddr = useShareableEventAddress(stream, relays);

  return (
    <Card as={LinkBox} {...props} ref={ref} position="relative">
      <Flex direction="column" gap="1" position="absolute" top="2" left="2" alignItems="start">
        <StreamStatusBadge stream={stream} fontSize="md" />
        {viewers.current !== undefined && (
          <Badge variant="solid" colorScheme="black">
            {viewers.current} viewers
          </Badge>
        )}
      </Flex>
      <ButtonGroup size="sm" variant="ghost" position="absolute" right="2" top="2">
        <StreamFavoriteButton stream={stream} />
        <DebugEventButton event={stream} />
      </ButtonGroup>

      <Box
        backgroundImage={image}
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
        backgroundSize="cover"
        aspectRatio={16 / 9}
        borderRadius="lg"
      />

      <CardBody p="2" display="flex" gap="2">
        <UserAvatar pubkey={host} size="md" noProxy />

        <Flex direction="column">
          <Heading size="sm" noOfLines={1}>
            <LinkOverlay as={RouterLink} to={`/streams/${naddr}`}>
              {title}
            </LinkOverlay>
          </Heading>
          <div>
            <UserLink pubkey={host} /> <UserDnsIdentityIcon pubkey={host} />
          </div>
          {starts && <Timestamp timestamp={starts} fontSize="sm" display="block" />}
        </Flex>
      </CardBody>
    </Card>
  );
}
export default memo(StreamCard);
