import { Card, CardBody, CardHeader, Flex, Heading, Image, LinkBox } from "@chakra-ui/react";
import { Link as RouterLink, useParams, useSearchParams } from "react-router";

import { getXPathString } from "../../../helpers/nostr/podcasts";
import HoverLinkOverlay from "../../../components/hover-link-overlay";

export default function EpisodeCard({ episode }: { episode: Element }) {
  const image = getXPathString(episode, "itunes:image");
  const title = getXPathString(episode, "title");
  const description = getXPathString(episode, "itunes:summary");
  const guid = getXPathString(episode, "guid");

  const { guid: podcastGuid } = useParams();
  const [search] = useSearchParams();

  return (
    <Card as={LinkBox} flexDirection="row" overflow="hidden">
      {image && <Image src={image} maxH="24" w="auto" />}
      <Flex direction="column" overflow="hidden" w="full">
        <CardHeader p="2" alignItems="center">
          <Heading size="sm">
            <HoverLinkOverlay
              as={RouterLink}
              to={{ pathname: `/podcasts/${podcastGuid}/${encodeURIComponent(guid)}`, search: search.toString() }}
            >
              {title}
            </HoverLinkOverlay>
          </Heading>
        </CardHeader>
        <CardBody display="block" px="2" pb="2" pt="0" noOfLines={2}>
          {description}
        </CardBody>
      </Flex>
    </Card>
  );
}
