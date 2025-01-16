import { Navigate, useParams, useSearchParams, Link as RouterLink } from "react-router";
import VerticalPageLayout from "../../../../components/vertical-page-layout";
import { Button, Flex, Heading, Image, Spinner, Text } from "@chakra-ui/react";
import ChevronLeft from "../../../../components/icons/chevron-left";
import useFeedXML from "../../../../hooks/use-feed-xml";
import { getXPathElements, getXPathString } from "../../../../helpers/nostr/podcasts";
import BackButton from "../../../../components/router/back-button";

function EpisodePage({ episode }: { episode: Element }) {
  const image = getXPathString(episode, "itunes:image");
  const title = getXPathString(episode, "title");
  const description = getXPathString(episode, "itunes:summary");
  const podcastGUID = getXPathString(episode, "//guid");

  return (
    <VerticalPageLayout>
      {image && <Image src={image} maxH="24" w="auto" />}
      <Flex direction="column" overflow="hidden" w="full">
        <Heading size="lg">{title}</Heading>
        <Text>{description}</Text>
      </Flex>
    </VerticalPageLayout>
  );
}

export default function EpisodeView() {
  const { guid, episode } = useParams();
  const [search] = useSearchParams();
  const url = search.get("feed") || search.get("url");

  if (!url || !guid || !episode) return <Navigate to="/podcasts" />;

  const { xml } = useFeedXML(url);
  if (!xml) return <Spinner />;

  let episodeXml: Element | undefined = undefined;
  const items = getXPathElements(xml, "//item");
  if (Number.isFinite(parseInt(episode))) {
    episodeXml = items[parseInt(episode)];
  } else {
    episodeXml = items.find((item) => getXPathString(item, "guid") === episode);
  }
  if (!episodeXml) throw new Error(`Cant find episode ${episode}`);

  return <EpisodePage episode={episodeXml} />;
}
