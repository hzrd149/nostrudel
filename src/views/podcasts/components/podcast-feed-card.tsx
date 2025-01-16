import { Card, CardBody, CardHeader, Flex, Heading, Image, LinkBox, Spinner } from "@chakra-ui/react";
import { To, Link as RouterLink } from "react-router";

import {
  FeedPointer,
  getPodcastDescription,
  getPodcastImageURL,
  getPodcastTitle,
} from "../../../helpers/nostr/podcasts";
import useFeedXML from "../../../hooks/use-feed-xml";
import HoverLinkOverlay from "../../../components/hover-link-overlay";

export default function PodcastFeedCard({ pointer, to }: { pointer: FeedPointer; to?: To }) {
  const { xml } = useFeedXML(pointer.url);

  if (!xml)
    return (
      <Card as={to ? LinkBox : "div"}>
        <CardHeader p="4" alignItems="center">
          <HoverLinkOverlay as={RouterLink} to={to}>
            <Spinner /> Fetching feed...
          </HoverLinkOverlay>
        </CardHeader>
        <CardBody px="4" pb="4" pt="0">
          {pointer.url.toString()}
        </CardBody>
      </Card>
    );

  const image = getPodcastImageURL(xml);

  return (
    <Card as={to ? LinkBox : "div"} flexDirection="row" overflow="hidden">
      {image && <Image src={image} maxH="24" w="auto" />}
      <Flex direction="column" overflow="hidden" w="full">
        <CardHeader p="2" alignItems="center">
          <Heading size="sm">
            <HoverLinkOverlay as={RouterLink} to={to}>
              {getPodcastTitle(xml)}
            </HoverLinkOverlay>
          </Heading>
        </CardHeader>
        <CardBody display="block" px="2" pb="2" pt="0" noOfLines={2}>
          {getPodcastDescription(xml)}
        </CardBody>
      </Flex>
    </Card>
  );
}
