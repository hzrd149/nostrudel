import { Heading, SimpleGrid } from "@chakra-ui/react";
import { kinds } from "nostr-tools";

import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import { getPackCordsFromFavorites } from "../../../helpers/nostr/emoji-packs";
import { getEventUID } from "../../../helpers/nostr/event";
import useFavoriteEmojiPacks from "../../../hooks/use-favorite-emoji-packs";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import useReplaceableEvents from "../../../hooks/use-replaceable-events";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import { useAdditionalRelayContext } from "../../../providers/local/additional-relay";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import EmojiPackCard from "../../emojis/components/emoji-pack-card";

export default function UserEmojiPacksTab() {
  const user = useParamsProfilePointer("pubkey");
  const readRelays = useAdditionalRelayContext();
  const mailboxes = useUserMailboxes(user);

  const { loader, timeline: packs } = useTimelineLoader(
    user.pubkey + "-emoji-packs",
    mailboxes?.outboxes || readRelays,
    {
      authors: [user.pubkey],
      kinds: [kinds.Emojisets],
    },
  );

  const favoritePacks = useFavoriteEmojiPacks(user);
  const favorites = useReplaceableEvents(favoritePacks && getPackCordsFromFavorites(favoritePacks));

  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <ScrollLayout maxW="6xl" center>
      <IntersectionObserverProvider callback={callback}>
        {packs.length > 0 && (
          <>
            <Heading size="lg" mt="2">
              Created packs
            </Heading>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="2">
              {packs.map((pack) => (
                <EmojiPackCard key={getEventUID(pack)} pack={pack} />
              ))}
            </SimpleGrid>
          </>
        )}
        {favorites.length > 0 && (
          <>
            <Heading size="lg" mt="2">
              Favorite packs
            </Heading>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="2">
              {favorites.map((event) => (
                <EmojiPackCard key={getEventUID(event)} pack={event} />
              ))}
            </SimpleGrid>
          </>
        )}
      </IntersectionObserverProvider>
    </ScrollLayout>
  );
}
