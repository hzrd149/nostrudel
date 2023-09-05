import { useOutletContext } from "react-router-dom";
import { Divider, Flex, Heading, SimpleGrid, Text } from "@chakra-ui/react";

import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import { getEventUID } from "../../helpers/nostr/events";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import EmojiPackCard from "../emoji-packs/components/emoji-pack-card";
import { EMOJI_PACK_KIND, getPackCordsFromFavorites } from "../../helpers/nostr/emoji-packs";
import useFavoriteEmojiPacks from "../../hooks/use-favorite-emoji-packs";
import useReplaceableEvents from "../../hooks/use-replaceable-events";

export default function UserEmojiPacksTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const timeline = useTimelineLoader(pubkey + "-emoji-packs", readRelays, {
    authors: [pubkey],
    kinds: [EMOJI_PACK_KIND],
  });
  const packs = useSubject(timeline.timeline);

  const favoritePacks = useFavoriteEmojiPacks(pubkey);
  const favorites = useReplaceableEvents(favoritePacks && getPackCordsFromFavorites(favoritePacks));

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <Flex gap="2" pt="2" pb="10" px={["2", "2", 0]} direction="column">
        {packs.length > 0 && (
          <>
            <Heading size="md" mt="2">
              Created packs
            </Heading>
            <Divider />
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="2">
              {packs.map((pack) => (
                <EmojiPackCard key={getEventUID(pack)} pack={pack} />
              ))}
            </SimpleGrid>
          </>
        )}
        {favorites.length > 0 && (
          <>
            <Heading size="md" mt="2">
              Favorite packs
            </Heading>
            <Divider />
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="2">
              {favorites.map((event) => (
                <EmojiPackCard key={getEventUID(event)} pack={event} />
              ))}
            </SimpleGrid>
          </>
        )}
      </Flex>
    </IntersectionObserverProvider>
  );
}
