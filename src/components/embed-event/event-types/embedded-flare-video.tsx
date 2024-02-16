import { Card, CardBody, CardProps, Flex, Heading, Image, Link, Text } from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { NostrEvent } from "../../../types/nostr-event";
import UserLink from "../../user/user-link";
import UserAvatar from "../../user/user-avatar";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import { getVideoDuration, getVideoImages, getVideoSummary, getVideoTitle } from "../../../helpers/nostr/flare";
import { getSharableEventAddress } from "../../../helpers/nip19";

export default function EmbeddedFlareVideo({ video, ...props }: Omit<CardProps, "children"> & { video: NostrEvent }) {
  const navigate = useNavigate();

  const title = getVideoTitle(video);
  const { thumb } = getVideoImages(video);
  const duration = getVideoDuration(video);
  const summary = getVideoSummary(video);

  const isVertical = useBreakpointValue({ base: true, md: false });
  const naddr = getSharableEventAddress(video);

  return (
    <Card {...props} position="relative">
      <CardBody p="2" gap="2">
        {isVertical ? (
          <Image
            src={thumb}
            borderRadius="md"
            cursor="pointer"
            onClick={() => navigate(`/videos/${naddr}`)}
            maxH="2in"
            mx="auto"
            mb="2"
          />
        ) : (
          <Image
            src={thumb}
            borderRadius="md"
            maxH="2in"
            maxW="30%"
            mr="2"
            float="left"
            cursor="pointer"
            onClick={() => navigate(`/videos/${naddr}`)}
          />
        )}

        <Heading size="md">
          <Link as={RouterLink} to={`/videos/${naddr}`}>
            {title}
          </Link>
        </Heading>
        <Flex gap="2" alignItems="center" my="2">
          <UserAvatar pubkey={video.pubkey} size="xs" />
          <Heading size="sm">
            <UserLink pubkey={video.pubkey} />
          </Heading>
        </Flex>
        <Text noOfLines={2}>{summary}</Text>
      </CardBody>
    </Card>
  );
}
