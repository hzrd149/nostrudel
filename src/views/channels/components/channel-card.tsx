import { Link as RouterLink } from "react-router-dom";
import { nip19 } from "nostr-tools";
import { EventPointer } from "nostr-tools/lib/types/nip19";
import {
  Box,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  Flex,
  Heading,
  LinkBox,
  Spinner,
  Text,
} from "@chakra-ui/react";

import useChannelMetadata from "../../../hooks/use-channel-metadata";
import { NostrEvent } from "../../../types/nostr-event";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import useSingleEvent from "../../../hooks/use-single-event";
import { useReadRelays } from "../../../hooks/use-client-relays";
import singleEventService from "../../../services/single-event";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";

export default function ChannelCard({
  channel,
  additionalRelays,
  ...props
}: Omit<CardProps, "children"> & { channel: NostrEvent; additionalRelays?: Iterable<string> }) {
  const readRelays = useReadRelays(additionalRelays);
  const { metadata } = useChannelMetadata(channel.id, readRelays);

  const ref = useEventIntersectionRef(channel);

  if (!channel || !metadata) return null;

  return (
    <Card as={LinkBox} flexDirection="row" gap="2" overflow="hidden" alignItems="flex-start" ref={ref} {...props}>
      <Box
        backgroundImage={metadata.picture}
        backgroundSize="cover"
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
        aspectRatio={1}
        w="7rem"
        flexShrink={0}
      />
      <Flex direction="column" flex={1} overflow="hidden" h="full">
        <CardHeader p="2" display="flex" gap="2" alignItems="center">
          <Heading size="md" isTruncated>
            <HoverLinkOverlay
              as={RouterLink}
              to={`/channels/${nip19.neventEncode({ id: channel.id })}`}
              onClick={() => singleEventService.handleEvent(channel)}
            >
              {metadata.name}
            </HoverLinkOverlay>
          </Heading>
        </CardHeader>
        <CardBody px="2" py="0" overflow="hidden" flexGrow={1}>
          <Text isTruncated>{metadata.about}</Text>
        </CardBody>
        <CardFooter p="2" gap="2">
          <UserAvatarLink pubkey={channel.pubkey} size="xs" />
          <UserLink pubkey={channel.pubkey} fontWeight="bold" />
        </CardFooter>
      </Flex>
    </Card>
  );
}

export function PointerChannelCard({ pointer, ...props }: Omit<CardProps, "children"> & { pointer: EventPointer }) {
  const channel = useSingleEvent(pointer.id, pointer.relays);
  if (!channel) return <Spinner />;
  return <ChannelCard channel={channel} {...props} />;
}
