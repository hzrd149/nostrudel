import { Navigate, useParams, useSearchParams } from "react-router-dom";
import {
  FeedPointer,
  getPodcastDescription,
  getPodcastImageURL,
  getPodcastItems,
  getPodcastPeople,
  getPodcastTitle,
  getXPathString,
} from "../../../helpers/nostr/podcasts";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import useFeedXML from "../../../hooks/use-feed-xml";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Avatar,
  AvatarGroup,
  Box,
  ButtonGroup,
  CloseButton,
  Flex,
  Heading,
  IconButton,
  Image,
  Link,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useMemo } from "react";
import EpisodeCard from "../components/episode-card";
import Rss01 from "../../../components/icons/rss-01";

function PodcastPage({ pointer, xml }: { pointer: FeedPointer; xml: Document }) {
  const image = getPodcastImageURL(xml);
  const episodes = useMemo(() => getPodcastItems(xml), [xml]);

  const people = getPodcastPeople(xml);

  return (
    <VerticalPageLayout>
      <Flex gap="4">
        <Image maxH="32" src={image} />
        <Box>
          <Heading size="lg">{getPodcastTitle(xml)}</Heading>
          <Text>{getPodcastDescription(xml)}</Text>
          {people.length > 0 && (
            <AvatarGroup>
              {people.map((person) => (
                <Avatar key={person.name} name={person.name} src={person.image} />
              ))}
            </AvatarGroup>
          )}
          <ButtonGroup variant="ghost" size="sm">
            <IconButton as={Link} href={pointer.url.toString()} isExternal icon={<Rss01 />} aria-label="Open RSS" />
          </ButtonGroup>
        </Box>
      </Flex>

      <Heading size="md">Episodes</Heading>
      {episodes.map((episode, i) => (
        <EpisodeCard key={getXPathString(episode, "guid", true) || i} episode={episode} />
      ))}
    </VerticalPageLayout>
  );
}

export default function PodcastView() {
  const { guid } = useParams();
  const [search] = useSearchParams();
  const url = search.get("feed") || search.get("url");

  if (!guid || !url) return <Navigate to="/podcasts" />;

  const pointer: FeedPointer = {
    guid,
    url: new URL(url),
  };

  const { xml, loading, error } = useFeedXML(url, true);

  if (error)
    return (
      <Alert status="error">
        <AlertIcon />
        <Box>
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Box>
      </Alert>
    );

  if (loading || !xml)
    return (
      <Alert status="info">
        <Spinner mr="4" />
        <Box>
          <AlertTitle>Loading...</AlertTitle>
          <AlertDescription>{url}</AlertDescription>
        </Box>
      </Alert>
    );

  return <PodcastPage pointer={pointer} xml={xml} />;
}
