import { Link as RouterLink } from "react-router-dom";
import { nip19 } from "nostr-tools";
import { EventPointer } from "nostr-tools/nip19";
import { Card, CardBody, CardHeader, CardProps, Flex, Heading, LinkBox, Spinner, Text } from "@chakra-ui/react";

import useChannelMetadata from "../../../hooks/use-channel-metadata";
import { NostrEvent } from "nostr-tools";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import useSingleEvent from "../../../hooks/use-single-event";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import ChannelImage from "./channel-image";

export default function ChannelCard({
  channel,
  additionalRelays,
  ...props
}: Omit<CardProps, "children"> & { channel: NostrEvent; additionalRelays?: Iterable<string> }) {
  const readRelays = useReadRelays(additionalRelays);
  const metadata = useChannelMetadata(channel, readRelays);

  const ref = useEventIntersectionRef(channel);

  if (!channel || !metadata) return null;

  return (
    <Card as={LinkBox} flexDirection="row" gap="2" alignItems="flex-start" ref={ref} {...props}>
      <ChannelImage channel={channel} w="5rem" flexShrink={0} />
      <Flex direction="column" flex={1} overflow="hidden" h="full">
        <CardHeader p="2" display="flex" gap="2" alignItems="center">
          <Heading size="md" isTruncated>
            <HoverLinkOverlay as={RouterLink} to={`/channels/${nip19.neventEncode({ id: channel.id })}`}>
              {metadata.name}
            </HoverLinkOverlay>
          </Heading>
        </CardHeader>
        <CardBody px="2" py="0" overflow="hidden" flexGrow={1}>
          <Text isTruncated>{metadata.about}</Text>
        </CardBody>
      </Flex>
    </Card>
  );
}

export function PointerChannelCard({ pointer, ...props }: Omit<CardProps, "children"> & { pointer: EventPointer }) {
  const channel = useSingleEvent(pointer);
  if (!channel) return <Spinner />;
  return <ChannelCard channel={channel} {...props} />;
}
