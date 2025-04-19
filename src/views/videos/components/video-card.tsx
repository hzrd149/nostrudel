import { Box, Card, CardBody, CardHeader, CardProps, Heading, LinkBox, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import HoverLinkOverlay from "../../../components/hover-link-overlay";
import { getVideoImages, getVideoSummary, getVideoTitle } from "../../../helpers/nostr/video";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";

export default function VideoCard({ video, ...props }: Omit<CardProps, "children"> & { video: NostrEvent }) {
  const title = getVideoTitle(video);
  const { thumb } = getVideoImages(video);
  const summary = getVideoSummary(video);

  const ref = useEventIntersectionRef(video);
  const address = useShareableEventAddress(video);

  return (
    <Card as={LinkBox} ref={ref} {...props}>
      <Box
        backgroundImage={thumb}
        aspectRatio={16 / 9}
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
        backgroundSize="cover"
      />
      <CardHeader p="2">
        <HoverLinkOverlay as={RouterLink} to={`/videos/${address}`}>
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
