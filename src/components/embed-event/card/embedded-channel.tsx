import { Box, Card, CardBody, CardFooter, CardHeader, CardProps, Flex, Heading, LinkBox, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { neventEncode } from "nostr-tools/nip19";
import { Link as RouterLink } from "react-router-dom";

import useChannelMetadata from "../../../hooks/use-channel-metadata";
import { useReadRelays } from "../../../hooks/use-client-relays";
import HoverLinkOverlay from "../../hover-link-overlay";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";

export default function EmbeddedChannel({
  channel,
  additionalRelays,
  ...props
}: Omit<CardProps, "children"> & { channel: NostrEvent; additionalRelays?: string[] }) {
  const readRelays = useReadRelays(additionalRelays);
  const metadata = useChannelMetadata(channel, readRelays);

  if (!channel || !metadata) return null;

  return (
    <Card as={LinkBox} flexDirection="row" gap="2" overflow="hidden" alignItems="flex-start" {...props}>
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
            <HoverLinkOverlay as={RouterLink} to={`/channels/${neventEncode(channel)}`}>
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
