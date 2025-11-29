import { Heading, SimpleGrid } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";
import { useObservableEagerMemo } from "applesauce-react/hooks";
import { Filter, NostrEvent } from "nostr-tools";
import { useMemo } from "react";
import { map, of, throttleTime } from "rxjs";

import { getStreamStreamingURLs } from "../../../../helpers/nostr/stream";
import { eventStore } from "../../../../services/event-store";
import { isStreamURL } from "applesauce-core/helpers";
import useClientSideMuteFilter from "../../../../hooks/use-client-side-mute-filter";
import useFavoriteStreams from "../../../../hooks/use-favorite-streams";
import StreamCard from "../stream-card";

const columns = { base: 1, md: 2, lg: 3, xl: 4, "2xl": 5 };

export default function FavoritesStreamsSection() {
  const muteFilter = useClientSideMuteFilter();
  const { streams: favorites } = useFavoriteStreams();

  // Filter favorites to only show those with video streams
  const filteredFavorites = useMemo(() => {
    return favorites.filter((stream) => {
      if (muteFilter(stream)) return false;
      const urls = getStreamStreamingURLs(stream);
      return urls.some(isStreamURL);
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
          <StreamCard key={getEventUID(stream)} stream={stream} />
        ))}
      </SimpleGrid>
    </>
  );
}

