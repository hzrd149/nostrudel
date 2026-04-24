import { Heading, SimpleGrid } from "@chakra-ui/react";
import { Stream } from "applesauce-common/casts";
import { isStreamURL } from "applesauce-core/helpers";
import { useMemo } from "react";

import useCastTimeline from "../../../../hooks/use-cast-timeline";
import useClientSideMuteFilter from "../../../../hooks/use-client-side-mute-filter";
import useFavoriteStreams from "../../../../hooks/use-favorite-streams";
import StreamCard from "../stream-card";

const columns = { base: 1, md: 2, lg: 3, xl: 4, "2xl": 5 };

export default function FavoritesStreamsSection() {
  const muteFilter = useClientSideMuteFilter();
  const { streams: favoriteEvents } = useFavoriteStreams();

  const favorites = useCastTimeline(favoriteEvents, Stream);

  const filteredFavorites = useMemo(() => {
    return favorites.filter((stream) => {
      if (muteFilter(stream.event)) return false;
      if (stream.streamingVideos.length === 0 && !stream.streamingURLs.some(isStreamURL)) return false;
      return true;
    });
  }, [favorites, muteFilter]);

  if (filteredFavorites.length === 0) return null;

  return (
    <>
      <Heading size="lg" mt="2">
        Favorites
      </Heading>
      <SimpleGrid columns={columns} spacing="2">
        {filteredFavorites.map((stream) => (
          <StreamCard key={stream.uid} stream={stream} />
        ))}
      </SimpleGrid>
    </>
  );
}
