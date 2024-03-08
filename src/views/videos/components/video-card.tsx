import { useRef } from "react";
import { Box, Card, CardBody, CardHeader, CardProps, Heading, Image, LinkBox, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { NostrEvent } from "../../../types/nostr-event";
import { useRegisterIntersectionEntity } from "../../../providers/local/intersection-observer";
import { getVideoDuration, getVideoImages, getVideoSummary, getVideoTitle } from "../../../helpers/nostr/flare";
import { getEventUID } from "../../../helpers/nostr/event";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import { getSharableEventAddress } from "../../../helpers/nip19";

export default function VideoCard({ video, ...props }: Omit<CardProps, "children"> & { video: NostrEvent }) {
  const title = getVideoTitle(video);
  const { thumb } = getVideoImages(video);
  const duration = getVideoDuration(video);
  const summary = getVideoSummary(video);

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(video));

  return (
    <Card as={LinkBox} {...props}>
      <Box
        backgroundImage={thumb}
        aspectRatio={16 / 9}
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
        backgroundSize="cover"
      />
      <CardHeader p="2">
        <HoverLinkOverlay as={RouterLink} to={`/videos/${getSharableEventAddress(video)}`}>
          <Heading size="sm" isTruncated>
            {title}
          </Heading>
        </HoverLinkOverlay>
      </CardHeader>
      <CardBody px="2" pb="2" pt="0">
        <Text noOfLines={2} fontSize="sm">
          {summary}
        </Text>
      </CardBody>
    </Card>
  );
}
